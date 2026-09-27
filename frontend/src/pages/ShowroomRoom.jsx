import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import VideoStage from "@/components/showroom/VideoStage";
import ReactionBar from "@/components/showroom/ReactionBar";
import CommentStream from "@/components/showroom/CommentStream";
import SpeakRequestPanel from "@/components/showroom/SpeakRequestPanel";
import FloatingReactions from "@/components/showroom/FloatingReactions";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Hand, Mic, LogOut, Radio, CheckCircle2, XCircle, ArrowLeft, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ShowroomRoom() {
  const { id } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [showroom, setShowroom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraOn, setCameraOn] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("chat");

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const room = await base44.entities.Showroom.get(id);
        setShowroom(room);

        const existing = await base44.entities.ShowroomMessage.filter({ showroom_id: id }, "-created_date", 200);
        setMessages(existing.reverse());

        if (room.status === "live" && room.host_id !== me.id) {
          await base44.entities.ShowroomMessage.create({
            showroom_id: id,
            sender_id: me.id,
            sender_name: me.full_name || "User",
            type: "join",
          });
        }
      } catch (e) {}
      setLoading(false);
    })();
  }, [id]);

  // Polling-based live updates (see base44Client.js) -- the REST API doesn't
  // push incremental create/update/delete events, so each tick just
  // re-fetches the current message list and showroom state.
  useEffect(() => {
    const unsub = base44.entities.ShowroomMessage.subscribe(async () => {
      const latest = await base44.entities.ShowroomMessage.filter({ showroom_id: id }, "-created_date", 200);
      setMessages(latest.reverse());
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    const unsub = base44.entities.Showroom.subscribe(async () => {
      const latest = await base44.entities.Showroom.get(id);
      if (latest) setShowroom(latest);
    });
    return unsub;
  }, [id]);

  const isHost = user && showroom && user.id === showroom.host_id;
  const isActiveSpeaker = user && showroom && showroom.active_speaker_id === user.id;
  const canUseCamera = isHost || isActiveSpeaker;

  const comments = messages.filter(m => m.type === "comment");
  const reactions = messages.filter(m => m.type === "reaction");
  const speakRequests = messages.filter(m => m.type === "speak_request");
  const joins = messages.filter(m => m.type === "join");
  const viewerIds = [...new Set(joins.map(j => j.sender_id))];
  const mySpeakRequest = speakRequests.find(r => r.sender_id === user?.id);
  const myRequestPending = mySpeakRequest && mySpeakRequest.status === "pending";

  const sendComment = async (text) => {
    if (!user) return;
    await base44.entities.ShowroomMessage.create({
      showroom_id: id, sender_id: user.id, sender_name: user.full_name || "User",
      type: "comment", content: text,
    });
  };

  const sendReaction = async (emoji) => {
    if (!user) return;
    await base44.entities.ShowroomMessage.create({
      showroom_id: id, sender_id: user.id, sender_name: user.full_name || "User",
      type: "reaction", content: emoji,
    });
  };

  const requestToSpeak = async () => {
    if (!user || mySpeakRequest) return;
    await base44.entities.ShowroomMessage.create({
      showroom_id: id, sender_id: user.id, sender_name: user.full_name || "User",
      type: "speak_request", status: "pending",
    });
    toast({ title: "Speak request sent", description: "Waiting for host approval." });
  };

  const approveSpeaker = async (msg) => {
    await base44.entities.ShowroomMessage.update(msg.id, { status: "approved" });
    await base44.entities.Showroom.update(id, {
      active_speaker_id: msg.sender_id,
      active_speaker_name: msg.sender_name,
    });
  };

  const rejectSpeaker = async (msg) => {
    await base44.entities.ShowroomMessage.update(msg.id, { status: "rejected" });
  };

  const endShowroom = async () => {
    await base44.entities.Showroom.update(id, { status: "ended", active_speaker_id: "", active_speaker_name: "" });
    setCameraOn(false);
    window.location.href = "/showroom";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 size={32} className="text-[#2E5BFF] animate-spin" />
      </div>
    );
  }

  if (!showroom) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Showroom not found</p>
          <Link to="/showroom" className="text-[#2E5BFF] hover:underline text-sm">Back to Showrooms</Link>
        </div>
      </div>
    );
  }

  if (showroom.status === "ended") {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Radio size={28} className="text-zinc-300" />
          </div>
          <p className="text-zinc-900 font-semibold mb-1">This showroom has ended</p>
          <p className="text-zinc-400 text-sm mb-6">The host has ended the live session.</p>
          <Link to="/showroom" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2E5BFF] text-white text-sm font-medium rounded-xl hover:bg-[#2E5BFF]/80 transition-colors">
            <ArrowLeft size={16} /> Back to Showrooms
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Please sign in to join this showroom</p>
          <Link to="/login" className="text-[#2E5BFF] hover:underline text-sm">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header />

      <div className="pt-24 pb-8 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to="/showroom" className="text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-zinc-900 font-bold text-lg">{showroom.title}</h1>
              <p className="text-zinc-400 text-xs">Hosted by {showroom.host_name || "Host"}</p>
            </div>
          </div>
          {isHost && (
            <button
              onClick={endShowroom}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={16} /> End Showroom
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main stage */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <VideoStage
                canUseCamera={canUseCamera}
                cameraOn={cameraOn}
                onToggleCamera={() => setCameraOn(v => !v)}
                isHost={isHost}
                isActiveSpeaker={isActiveSpeaker}
                hostName={showroom.host_name}
                productTitle={showroom.product_title}
                description={showroom.description}
                viewerCount={viewerIds.length}
                isLive={showroom.status === "live"}
              />
              <FloatingReactions reactions={reactions} />
            </div>

            {/* Reaction bar */}
            <ReactionBar onReact={sendReaction} disabled={!user} />

            {/* Viewer action bar */}
            {!isHost && (
              <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl p-3">
                {mySpeakRequest && mySpeakRequest.status === "approved" ? (
                  <div className="flex items-center gap-2 text-[#00E676] text-sm font-medium flex-1">
                    <CheckCircle2 size={18} /> You're approved to speak! Turn on your camera above.
                  </div>
                ) : mySpeakRequest && mySpeakRequest.status === "rejected" ? (
                  <div className="flex items-center gap-2 text-red-400 text-sm flex-1">
                    <XCircle size={18} /> Your speak request was declined.
                  </div>
                ) : myRequestPending ? (
                  <div className="flex items-center gap-2 text-[#FF9800] text-sm flex-1">
                    <Clock size={18} /> Waiting for host to approve your speak request...
                  </div>
                ) : (
                  <button
                    onClick={requestToSpeak}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FF9800]/10 border border-[#FF9800]/20 text-[#FF9800] text-sm font-medium rounded-xl hover:bg-[#FF9800]/20 transition-colors flex-1 justify-center"
                  >
                    <Hand size={16} /> Request to Speak
                  </button>
                )}
                <Link
                  to="/showroom"
                  className="flex items-center gap-1.5 px-3 py-2 text-zinc-500 hover:text-zinc-900 text-sm transition-colors"
                >
                  <LogOut size={14} /> Leave
                </Link>
              </div>
            )}

            {/* Active speaker banner */}
            {showroom.active_speaker_name && !isActiveSpeaker && (
              <div className="flex items-center gap-2 bg-[#00E676]/10 border border-[#00E676]/20 rounded-xl px-4 py-2.5">
                <Mic size={14} className="text-[#00E676]" />
                <span className="text-[#00E676] text-sm font-medium">{showroom.active_speaker_name} is speaking</span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col h-[600px]">
              {/* Tab switcher */}
              <div className="flex border-b border-zinc-200">
                <button
                  onClick={() => setSidebarTab("chat")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    sidebarTab === "chat" ? "text-zinc-900 border-b-2 border-[#2E5BFF]" : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  Chat
                </button>
                {isHost && (
                  <button
                    onClick={() => setSidebarTab("requests")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                      sidebarTab === "requests" ? "text-zinc-900 border-b-2 border-[#2E5BFF]" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    Requests
                    {speakRequests.filter(r => r.status === "pending").length > 0 && (
                      <span className="absolute top-2 right-4 w-2 h-2 bg-[#FF9800] rounded-full" />
                    )}
                  </button>
                )}
              </div>

              {sidebarTab === "chat" ? (
                <CommentStream
                  comments={comments}
                  onSend={sendComment}
                  disabled={!user}
                  currentUserId={user?.id}
                />
              ) : (
                <SpeakRequestPanel
                  requests={speakRequests}
                  onApprove={approveSpeaker}
                  onReject={rejectSpeaker}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}