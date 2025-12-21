import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { Send, Paperclip, MapPin, ArrowLeft, Heart, Trash2, X, FileText, Image as ImageIcon, Reply, Search, UserCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import FilePreviewModal from '../components/FilePreviewModal';

function Chat() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

        const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const selectedUserRef = useRef(null);
    const userRef = useRef(user);     const isAtBottomRef = useRef(true);

        const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState('doctor');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

        useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
    useEffect(() => { userRef.current = user; }, [user]);

    const getConversationId = (uid1, uid2) => {
        return [uid1, uid2].sort().join('_');
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/users`, { withCredentials: true });
            if (!userRef.current) return;
            const otherUsers = res.data.filter(u => u._id !== userRef.current._id);
            setUsers(otherUsers);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load contacts');
        }
    };

    const fetchMessages = async (targetUserId) => {
        try {
            if (!userRef.current) return;
            const myId = userRef.current._id || userRef.current.id;
            const conversationId = getConversationId(myId, targetUserId);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/messages?conversationId=${conversationId}`, { withCredentials: true });
            setMessages(res.data);
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load chat history');
        }
    };

        useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        socketRef.current = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket']
        });

        socketRef.current.emit('user_connected', user._id || user.id);
        fetchUsers();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, navigate]);

        useEffect(() => {
                                                                                                
        if (!user) return; 
                                        
        const attachListeners = () => {
            if (!socketRef.current) return;
            const socket = socketRef.current;

            const handleStatusUpdate = ({ userId, isOnline, lastActive }) => {
                setUsers(prevUsers => prevUsers.map(u =>
                    u._id === userId ? { ...u, isOnline, lastActive } : u
                ));

                if (selectedUserRef.current?._id === userId) {
                    setSelectedUser(prev => ({ ...prev, isOnline, lastActive }));
                }
            };

            const handleReceiveMessage = (data) => {
                const myId = userRef.current?._id || userRef.current?.id;
                const targetId = selectedUserRef.current?._id || selectedUserRef.current?.id;

                                if (data.conversationId === getConversationId(myId, targetId)) {
                    setMessages((prev) => [...prev, data]);
                    if (!isAtBottomRef.current) {
                        setUnreadCount(prev => prev + 1);
                    } else {
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                } else {
                                        if (data.sender !== userRef.current.name) {
                        toast.success(`New message from ${data.sender}`, { icon: '💬' });
                    }
                }
            };

            const handleMessageUpdate = (updatedMsg) => {
                setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
            };

            const handleDeleteMessage = ({ messageId }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, isDeleted: true } : msg
                ));
            }

            const handleRelationshipUpdate = () => {
                                                                                                                                                                                                                                                            };

            socket.on('user_status_update', handleStatusUpdate);
            socket.on('receive_message', handleReceiveMessage);
            socket.on('message_updated', handleMessageUpdate);
            socket.on('delete_message_notification', handleDeleteMessage);                                                                                                             
            socket.on('relationship_updated', () => {
                                                                            });

            return () => {
                socket.off('user_status_update', handleStatusUpdate);
                socket.off('receive_message', handleReceiveMessage);
                socket.off('message_updated', handleMessageUpdate);
                socket.off('relationship_updated');
                            };
        };

                                                                
        const cleanup = attachListeners();
        return cleanup;

    }, [user]); 
        useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser._id);
            setUnreadCount(0);
        }
    }, [selectedUser]);

    const filteredUsers = useMemo(() => {
        let candidates = users;

        if (searchQuery) {
            return candidates.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (user.role === 'admin') {
            if (userFilter === 'doctor') {
                candidates = candidates.filter(u => u.role === 'doctor');
            } else if (userFilter === 'patient') {
                candidates = candidates.filter(u => u.role === 'patient');
            }
        } else if (user.role === 'doctor') {
            candidates = candidates.filter(u =>
                u.role === 'admin' ||
                u.role === 'doctor' ||
                (u.role === 'patient')
            );
        } else if (user.role === 'patient') {
                        candidates = candidates.filter(u =>
                u.role === 'admin' ||
                (u.role === 'doctor' && user.assignedDoctors?.some(d => (d._id || d) === u._id))
            );
        }

        return candidates;
    }, [users, userFilter, user.role, user.assignedDoctors, searchQuery]);

    const sendMessage = (type = 'text', content = null, extraData = {}) => {
        if (!selectedUser) return;
        if ((type === 'text' && !message.trim()) || (type !== 'text' && !content)) return;

        const senderId = user._id || user.id;
        const receiverId = selectedUser._id || selectedUser.id;

                const replySnapshot = replyingTo ? {
            _id: replyingTo._id,
            sender: replyingTo.sender,
            content: replyingTo.content,
            type: replyingTo.type
        } : null;

        const msgData = {
            sender: user.name,
            receiver: selectedUser.name,
            conversationId: getConversationId(senderId, receiverId),
            role: user.role,
            content: content || message,
            type: type,
            timestamp: new Date(),
            replyTo: replySnapshot,             ...extraData
        };

        socketRef.current.emit('send_message', msgData);

        if (type === 'text') setMessage('');
        setReplyingTo(null);
        setShowEmojiPicker(false);
    };

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;         isAtBottomRef.current = isBottom;
        if (isBottom) setUnreadCount(0);
    };

    const handleEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            toast.loading(`Uploading ${files.length} file(s)...`);
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.dismiss();
            toast.success('Files sent');

            res.data.forEach(fileData => {
                const type = fileData.originalType.startsWith('image/') ? 'image' : 'file';

                sendMessage(type, fileData.fileName, {
                    fileUrl: fileData.fileUrl,
                    fileName: fileData.fileName,
                    fileSize: fileData.fileSize
                });
            });

                        if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.error('Upload failed');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLocationShare = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }
        toast.loading('Getting location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                sendMessage('location', 'Shared Location', {
                    location: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                });
            },
            () => {
                toast.dismiss();
                toast.error('Unable to retrieve location');
            }
        );
    };

    const handleLike = (msgId) => {
        socketRef.current.emit('like_message', { messageId: msgId, userId: user._id, userName: user.name });
    };

    const handleDelete = (msgId) => {
        if (confirm('Are you sure you want to delete this message?')) {
                        setMessages(prev =>
                prev.map(m =>
                    m._id === msgId ? { ...m, isDeleted: true } : m
                )
            );

            socketRef.current.emit('delete_message', { messageId: msgId, userName: user.name });
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">

            {}
            <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => {
                                if (user?.role === 'doctor') navigate('/doctor-dashboard');
                                else if (user?.role === 'admin') navigate('/admin/dashboard');
                                else navigate('/health-dashboard');
                            }}
                            className="mr-3 text-gray-500 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-200"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">Messages</h1>
                    </div>

                    {user.role === 'admin' && (
                        <div className="flex bg-gray-200 rounded-lg p-1 text-xs font-semibold">
                            <button
                                onClick={() => setUserFilter('doctor')}
                                className={`px-3 py-1.5 rounded-md transition ${userFilter === 'doctor' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                Doctors
                            </button>
                            <button
                                onClick={() => setUserFilter('patient')}
                                className={`px-3 py-1.5 rounded-md transition ${userFilter === 'patient' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                Patients
                            </button>
                        </div>
                    )}
                </div>

                {}
                <div className="p-4 bg-white border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {}
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <div
                                key={u._id}
                                onClick={() => setSelectedUser(u)}
                                className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 ${selectedUser?._id === u._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            >
                                <div className="relative mr-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                                        {u.photoUrl ? (
                                            <img src={u.photoUrl} alt={u.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold">{u.name?.charAt(0)}</span>
                                        )}
                                    </div>

                                    {u.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{u.name}</h3>

                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <span className="capitalize font-medium">{u.role}</span>
                                        {u.role === 'doctor' && u.specialization && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <span className="text-blue-600">{u.specialization}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <UserCircle2 size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No contacts found</p>
                        </div>
                    )}
                </div>
            </div>

            {}
            <div className={`flex-1 flex flex-col bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                {selectedUser ? (
                    <>
                        {}
                        <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white shadow-sm z-10">
                            <div className="flex items-center">
                                <button onClick={() => setSelectedUser(null)} className="mr-3 md:hidden text-gray-500">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                                        {selectedUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-800">{selectedUser.name}</h2>
                                        <div className="flex items-center text-xs">
                                            {selectedUser.isOnline ? (
                                                <>
                                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                                    <span className="text-green-600 font-medium">Active Now</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                                                    <span className="text-gray-500 font-medium">
                                                        Inactive
                                                        {selectedUser.lastActive && (
                                                            <span className="ml-1 opacity-75">
                                                                ({new Date(selectedUser.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                                            </span>
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">

                            </div>
                        </div>

                        {}
                        <div
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-100"
                        >
                            {messages.map((msg, index) => {
                                const isMe = msg.sender === user?.name;
                                const isDeleted = msg.isDeleted;
                                const reply = msg.replyTo;

                                return (
                                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                                            <div className={`px-4 py-3 rounded-2xl shadow-sm relative group ${isDeleted
                                                ? 'bg-gray-200 border border-gray-300 italic text-gray-500'
                                                : isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}>

                                                {}
                                                {reply && !isDeleted && (
                                                    <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 ${isMe ? 'bg-blue-500 border-white/50 text-white' : 'bg-gray-100 border-blue-500 text-gray-600'}`}>
                                                        <p className="font-bold mb-0.5">{reply.sender || 'Unknown'}</p>
                                                        <p className="truncate opacity-80">{reply.type === 'text' ? reply.content : `Sent a ${reply.type}`}</p>
                                                    </div>
                                                )}

                                                {}
                                                {isDeleted ? (
                                                    <div className="flex items-center text-sm italic opacity-70">
                                                        <Trash2 size={14} className="mr-2" />
                                                        Message deleted{msg.deletedBy ? ` by ${msg.deletedBy}` : ''}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {}
                                                        {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.content}</p>}

                                                        {}
                                                        {msg.type === 'image' && (
                                                            <div className="mb-1">
                                                                <img
                                                                    src={msg.fileUrl}
                                                                    alt="Shared"
                                                                    className="rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-95 shadow-sm"
                                                                    onClick={() => setPreviewFile({ url: msg.fileUrl, name: msg.fileName || 'Image', type: 'image' })}
                                                                />
                                                            </div>
                                                        )}

                                                        {}
                                                        {msg.type === 'file' && (
                                                            <button
                                                                onClick={() => setPreviewFile({ url: msg.fileUrl, name: msg.fileName, type: 'file' })}
                                                                className={`flex items-center p-3 rounded-lg ${isMe ? 'bg-blue-500 hover:bg-blue-400' : 'bg-gray-100 hover:bg-gray-200'} transition w-full text-left group-hover:shadow-md`}
                                                            >
                                                                <FileText size={24} className="mr-3 flex-shrink-0" />
                                                                <div className="overflow-hidden">
                                                                    <p className="font-semibold truncate text-sm">{msg.fileName}</p>
                                                                    <p className="text-xs opacity-75">{msg.fileSize} • Click to preview</p>
                                                                </div>
                                                            </button>
                                                        )}

                                                        {}
                                                        {msg.type === 'location' && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center p-2 rounded-lg ${isMe ? 'bg-blue-500' : 'bg-gray-100'} hover:opacity-90 transition`}
                                                            >
                                                                <MapPin className="mr-2 text-red-500" />
                                                                <span className="underline decoration-dotted">View Location</span>
                                                            </a>
                                                        )}
                                                    </>
                                                )}

                                                {}
                                                {!isDeleted && (
                                                    <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-100 transition-opacity`}>
                                                        <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>

                                                        {}
                                                        <button
                                                            onClick={() => setReplyingTo(msg)}
                                                            className={`p-1 rounded-full hover:bg-black/10 transition ${isMe ? 'text-blue-100 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                                            title="Reply"
                                                        >
                                                            <Reply size={12} />
                                                        </button>

                                                        {}
                                                        <button
                                                            onClick={() => handleLike(msg._id)}
                                                            className={`p-1 rounded-full hover:bg-black/10 transition ${msg.likes?.includes(user?.name) ? 'text-red-500' : (isMe ? 'text-blue-100 hover:text-white' : 'text-gray-400 hover:text-gray-600')}`}
                                                        >
                                                            <Heart size={12} fill={msg.likes?.includes(user?.name) ? "currentColor" : "none"} />
                                                        </button>
                                                        {msg.likes?.length > 0 && <span className={`text-[10px] ml-[-2px] ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>{msg.likes.length}</span>}

                                                        {}
                                                        {isMe && (
                                                            <button onClick={() => handleDelete(msg._id)} className="p-1 rounded-full hover:bg-black/10 text-blue-100 hover:text-red-500 transition">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {}
                        <div className="bg-white p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-30">

                            {}
                            {replyingTo && (
                                <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-t-xl border-b border-blue-100 mb-2">
                                    <div className="flex items-center text-sm text-blue-700">
                                        <Reply size={14} className="mr-2" />
                                        <span className="font-semibold mr-1">Replying to {replyingTo.sender}:</span>
                                        <span className="truncate max-w-xs opacity-75">
                                            {replyingTo.type === 'text' ? replyingTo.content : `[${replyingTo.type}]`}
                                        </span>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="text-blue-400 hover:text-blue-600">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {showEmojiPicker && (
                                <div className="absolute bottom-20 left-4 z-40 shadow-2xl rounded-xl">
                                    <div className="flex justify-end bg-white p-1 rounded-t-xl border-b">
                                        <button onClick={() => setShowEmojiPicker(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={16} /></button>
                                    </div>
                                    <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
                                </div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); sendMessage('text'); }} className="flex items-end gap-2 max-w-7xl mx-auto">
                                {}
                                <div className="flex gap-1 mb-2">
                                    <input
                                        type="file"
                                        multiple
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                                        title="Attach File/Image"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLocationShare}
                                        className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                                        title="Share Location"
                                    >
                                        <MapPin size={20} />
                                    </button>
                                </div>

                                {}
                                <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="text-gray-500 hover:text-yellow-500 transition mr-2"
                                    >
                                        😊
                                    </button>
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent border-none focus:outline-none py-2 max-h-32"
                                    />
                                </div>

                                {}
                                <button
                                    type="submit"
                                    disabled={!message.trim()}
                                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition transform hover:scale-105 mb-1"
                                >
                                    <Send size={20} className="ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                            <Send size={48} className="text-gray-400 ml-2" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">Select a Conversation</h2>
                        <p className="max-w-md text-center">Choose a user from the sidebar to start a private chat. You can connect with doctors and patients instantly.</p>
                    </div>
                )}
            </div>

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                fileUrl={previewFile?.url}
                fileName={previewFile?.name}
                fileType={previewFile?.type}
                useBlobDownload={true}
            />
        </div>
    );
}

export default Chat;
