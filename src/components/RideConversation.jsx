import React, { useEffect, useMemo, useState } from "react";
import { Clock, Send, Phone, MapPin } from "lucide-react";
import {
  getRideRequestMessages,
  sendRideRequestMessage,
} from "../services/api";
import "./RideConversation.css";

const isConversationOpen = (request) =>
  request.status === "accepted" && request.ride?.status !== "completed";

const RideConversation = ({
  requests = [],
  currentUser,
  role = "passenger",
  title = "Viajes aceptados",
  onRefresh,
}) => {
  const acceptedRequests = useMemo(
    () => requests.filter((request) => isConversationOpen(request)),
    [requests],
  );

  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!acceptedRequests.length) {
      setSelectedRequestId("");
      setMessages([]);
      return;
    }

    if (!acceptedRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(acceptedRequests[0].id);
    }
  }, [acceptedRequests, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequestId || !currentUser?.id) {
      setMessages([]);
      return;
    }

    let isActive = true;
    let intervalId = null;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setError("");
        const thread = await getRideRequestMessages(
          selectedRequestId,
          currentUser.id,
        );
        if (isActive) {
          setMessages(thread);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || "No se pudo cargar la conversación.");
        }
      } finally {
        if (isActive) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();
    intervalId = window.setInterval(loadMessages, 10000);

    return () => {
      isActive = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [currentUser?.id, selectedRequestId]);

  const selectedRequest = acceptedRequests.find(
    (request) => request.id === selectedRequestId,
  );
  const companion =
    role === "driver" ? selectedRequest?.passenger : selectedRequest?.driver;
  const ride = selectedRequest?.ride;
  const otherRoleLabel = role === "driver" ? "Pasajero" : "Conductor";
  const currentPhone = currentUser?.phoneNumber || "";
  const companionPhone = companion?.phoneNumber || "";

  if (!acceptedRequests.length) {
    return null;
  }

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const content = messageText.trim();
    if (!content || !selectedRequestId || !currentUser?.id) return;

    try {
      setIsSendingMessage(true);
      const sentMessage = await sendRideRequestMessage(
        selectedRequestId,
        currentUser.id,
        content,
      );
      setMessages((prev) => [...prev, sentMessage]);
      setMessageText("");
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "No se pudo enviar el mensaje.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <section className="ride-conversation glass-panel">
      <div className="ride-conversation-header">
        <div>
          <p className="ride-conversation-kicker">Comunicación activa</p>
          <h2>{title}</h2>
          <p className="text-secondary">
            Selecciona un viaje aceptado para ver el chat y los teléfonos de
            contacto.
          </p>
        </div>
        <span className="ride-conversation-count">
          {acceptedRequests.length} activos
        </span>
      </div>

      <div className="ride-conversation-layout">
        <aside className="ride-conversation-list">
          {acceptedRequests.map((request) => {
            const partner =
              role === "driver" ? request.passenger : request.driver;

            return (
              <button
                key={request.id}
                type="button"
                className={`ride-conversation-item ${request.id === selectedRequestId ? "active" : ""}`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <div>
                  <strong>{partner?.name || "Viaje aceptado"}</strong>
                  <p>
                    {request.ride?.from?.name || "Origen"} →{" "}
                    {request.ride?.to?.name || "Destino"}
                  </p>
                </div>
                <span className="status-badge accepted">Aceptado</span>
              </button>
            );
          })}
        </aside>

        <div className="ride-conversation-thread">
          {selectedRequest ? (
            <>
              <div className="ride-conversation-summary">
                <div className="ride-conversation-route">
                  <MapPin size={16} />
                  <span>
                    {ride?.from?.name || "Origen"} →{" "}
                    {ride?.to?.name || "Destino"}
                  </span>
                </div>
                <div className="ride-conversation-meta">
                  <span>
                    <Clock size={14} /> {ride?.time || "Hora pendiente"}
                  </span>
                  <span>${ride?.price || 0} MXN</span>
                </div>
              </div>

              <div className="ride-conversation-contact-grid">
                <article>
                  <p>{otherRoleLabel} de contacto</p>
                  <strong>{companion?.name || "Sin nombre"}</strong>
                  <span>{companionPhone || "No registró teléfono"}</span>
                </article>
                <article>
                  <p>Tu teléfono</p>
                  <strong>{currentPhone || "Agrega uno en tu perfil"}</strong>
                  <span>
                    {currentPhone
                      ? "Listo para compartir por chat"
                      : "Te recomendamos registrarlo para una mejor coordinación"}
                  </span>
                </article>
              </div>

              {error && <p className="ride-conversation-error">{error}</p>}

              <div className="ride-conversation-messages">
                {isLoadingMessages ? (
                  <p className="ride-conversation-placeholder">
                    Cargando mensajes...
                  </p>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const mine = message.senderId === String(currentUser?.id);
                    return (
                      <article
                        key={message.id}
                        className={`ride-message ${mine ? "mine" : "theirs"}`}
                      >
                        <div className="ride-message-header">
                          <strong>{mine ? "Tú" : message.senderName}</strong>
                          <span>
                            {new Date(message.createdAt).toLocaleString(
                              "es-MX",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              },
                            )}
                          </span>
                        </div>
                        <p>{message.body}</p>
                      </article>
                    );
                  })
                ) : (
                  <p className="ride-conversation-placeholder">
                    Aún no hay mensajes. Escribe el primero para coordinar el
                    viaje.
                  </p>
                )}
              </div>

              <form
                className="ride-conversation-form"
                onSubmit={handleSendMessage}
              >
                <textarea
                  className="input-field ride-conversation-input"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={`Escribe un mensaje para tu ${otherRoleLabel.toLowerCase()}...`}
                  rows={3}
                />
                <div className="ride-conversation-actions">
                  <span className="ride-conversation-note">
                    <Phone size={14} />
                    {companionPhone
                      ? `Teléfono: ${companionPhone}`
                      : "Pide al otro usuario que complete su teléfono en su perfil."}
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSendingMessage}
                  >
                    <Send size={16} />
                    {isSendingMessage ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default RideConversation;
