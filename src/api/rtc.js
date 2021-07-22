const { RTCPeerConnection } = require('wrtc');

module.exports = io => {
    const peers = {};
    const tracks = {};
    io.on('connect', socket => {
        socket.once('chatrtc', async (conversationId, offer, _return) => {
            const peer = new RTCPeerConnection({ 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] });
            await peer.setRemoteDescription(offer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            _return(answer);
            socket.on('negotiationneeded', async (offer, _return) => {
                if (peer.signalingState === 'have-local-offer') return;
                await peer.setRemoteDescription(offer);
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                _return(answer);
            });
            peer.onnegotiationneeded = async () => {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('negotiationneeded', offer, answer => peer.setRemoteDescription(answer));
            }
            peer.onicecandidate = e => socket.emit('icecandidate', e.candidate);
            socket.on('icecandidate', candidate => candidate && peer.addIceCandidate(candidate));

            tracks[conversationId]?.forEach(t => peer.addTrack(t));

            peer.ontrack = e => {
                if (!tracks[conversationId]) {
                    tracks[conversationId] = new Set();
                }
                tracks[conversationId].add(e.track);
                peers[conversationId]?.forEach(p => p.addTrack(e.track));
            }

            peer.socket = socket;
            socket.on('removetrack', i => {
                const track = peer.getTransceivers()[i].receiver.track;
                tracks[conversationId].delete(track);
                peers[conversationId].forEach(p => {
                    p.getTransceivers().forEach((tc, i) => {
                        if (tc.sender.track === track) {
                            p.removeTrack(tc.sender);
                            p.socket.emit('removetrack', i);
                        }
                    });
                });
            });

            peer.onconnectionstatechange = () => {
                if (peer.connectionState === 'connected') {
                    if (!peers[conversationId]) {
                        peers[conversationId] = new Set();
                    }
                    peers[conversationId].add(peer);
                    peer.onconnectionstatechange = () => {
                        if (peer.connectionState === 'disconnected') {
                            peers[conversationId].delete(peer);
                            peer.getTransceivers().forEach(tc => {
                                if (tracks[conversationId]?.has(tc.receiver.track)) {
                                    tracks[conversationId].delete(tc.receiver.track);
                                    peers[conversationId].forEach(p => {
                                        p.getTransceivers().forEach((tc1, i) => {
                                            if (tc1.sender.track === tc.receiver.track) {
                                                p.removeTrack(tc1.sender);
                                                p.socket.emit('removetrack', i);
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    }
                }
            }
        });
    });
}

