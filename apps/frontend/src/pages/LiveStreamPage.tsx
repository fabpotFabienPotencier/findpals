import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { live } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8023';

export const LiveStreamPage = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [title, setTitle] = useState('Main Stage');
    const [accessMode, setAccessMode] = useState<'public' | 'private' | 'followers' | 'subscribers' | 'ppv' | 'invite-only'>('public');
    const [price, setPrice] = useState(0);
    const [isRecordingRequested, setIsRecordingRequested] = useState(false);
    const [tipAmount, setTipAmount] = useState(5);
    const [error, setError] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!roomId) return;

        const s = io(`${SOCKET_URL}/live`, { transports: ['websocket'] });
        setSocket(s);

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
        });
        setPeerConnection(pc);

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && s) {
                s.emit('ice-candidate', { roomId, candidate: event.candidate });
            }
        };

        s.on('connect', async () => {
            s.emit('joinRoom', { roomId, userId: s.id });

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            s.emit('offer', { roomId, offer });
        });

        s.on('offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
            if (!pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                s.emit('answer', { roomId, answer });
            }
        });

        s.on('answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            if (!pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        s.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
                // ignore candidate errors in MVP
            }
        });

        return () => {
            s.disconnect();
            pc.close();
        };
    }, [roomId]);

    const handleGoLive = async () => {
        setError(null);
        try {
            const res = await live.createRoom(title, accessMode, price, isRecordingRequested);
            setRoomId(res.data.id);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to create live room');
        }
    };

    const handleTip = async () => {
        if (!roomId) return;
        try {
            await live.tipRoom(roomId, tipAmount);
        } catch {
            // minimal feedback
        }
    };

    return (
        <div className="h-screen bg-black text-white p-4 space-y-6">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Live Control Room</h1>

            {/* Go Live Configuration */}
            {!roomId && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col gap-3 max-w-xl">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            placeholder="Stream title"
                        />
                        <select
                            value={accessMode}
                            onChange={(e) => setAccessMode(e.target.value as any)}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="followers">Followers</option>
                            <option value="subscribers">Subscribers</option>
                            <option value="ppv">PPV</option>
                            <option value="invite-only">Invite Only</option>
                        </select>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-24 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                            placeholder="Price"
                            min={0}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                        <input
                            type="checkbox"
                            checked={isRecordingRequested}
                            onChange={(e) => setIsRecordingRequested(e.target.checked)}
                        />
                        Request recording metadata for replay
                    </label>
                    {error && <div className="text-xs text-red-400">{error}</div>}
                    <button
                        onClick={handleGoLive}
                        className="self-start bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded font-bold text-xs uppercase tracking-[0.2em]"
                    >
                        Go Live
                    </button>
                </div>
            )}

            {/* Live Room */}
            {roomId && (
                <>
                    <div className="text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">
                        Room ID: {roomId} • Access: {accessMode.toUpperCase()}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative border border-cyan-500/60 rounded-lg overflow-hidden h-96 bg-slate-900">
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-xs font-mono uppercase tracking-[0.2em]">
                                You
                            </div>
                        </div>
                        <div className="relative border border-fuchsia-500/60 rounded-lg overflow-hidden h-96 bg-slate-900">
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-xs font-mono uppercase tracking-[0.2em]">
                                Remote
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 items-center">
                        <button
                            onClick={() => {
                                if (socket) socket.disconnect();
                                if (peerConnection) peerConnection.close();
                                setRoomId(null);
                            }}
                            className="bg-red-500 hover:bg-red-400 px-6 py-2 rounded font-bold text-sm uppercase tracking-[0.2em]"
                        >
                            End Stream
                        </button>
                        <div className="flex items-center gap-2 text-xs">
                            <input
                                type="number"
                                value={tipAmount}
                                onChange={(e) => setTipAmount(Number(e.target.value))}
                                className="w-20 bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs"
                                min={1}
                            />
                            <button
                                onClick={handleTip}
                                className="bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 rounded font-bold text-[10px] uppercase tracking-[0.2em]"
                            >
                                Tip Stream
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
