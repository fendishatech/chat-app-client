import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Button } from '../../global/shadcn/components/ui/button';
import { Input } from '../../global/shadcn/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../global/shadcn/components/ui/card';
import { Badge } from '../../global/shadcn/components/ui/badge';
import { Avatar } from '../../global/shadcn/components/ui/avatar';
import { ScrollArea } from '../../global/shadcn/components/ui/scroll-area';
import { Separator } from '../../global/shadcn/components/ui/separator';
import { Label } from '../../global/shadcn/components/ui/label';
import { Send, Users, Wifi, WifiOff, UserPlus, UserMinus } from 'lucide-react';

// Message interface
interface Message {
  id?: string;
  content: string;
  user: {
    username: string;
    id?: number;
  };
  createdAt: string | Date;
  isSystem?: boolean;
}

// User interface
interface User {
  id: number;
  username: string;
}

let socket: any = null;

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('TestUser');
  const [userId, setUserId] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showStatus = (message: string, isError = false) => {
    setStatus({ message, isError });
    setTimeout(() => setStatus(null), 3000);
  };

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      content,
      user: { username: 'System' },
      createdAt: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const joinChat = () => {
    if (!username.trim() || !userId) {
      showStatus('Please enter both username and user ID', true);
      return;
    }

    if (socket) {
      socket.disconnect();
    }

    // Connect to Socket.IO server
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setIsConnected(true);
      showStatus('Connected to server');
      
      // Join the chat
      socket.emit('joinChat', { username, userId });
      setIsJoined(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
      showStatus('Disconnected from server', true);
    });

    socket.on('recentMessages', (recentMessages: Message[]) => {
      setMessages(recentMessages);
    });

    socket.on('newMessage', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on('userJoined', (data: { username: string }) => {
      addSystemMessage(`${data.username} joined the chat`);
    });

    socket.on('userLeft', (data: { username: string }) => {
      addSystemMessage(`${data.username} left the chat`);
    });

    socket.on('onlineUsers', (users: User[]) => {
      setOnlineUsers(users);
    });

    socket.on('userTyping', (data: { username: string; isTyping: boolean }) => {
      if (data.isTyping && data.username !== username) {
        addSystemMessage(`${data.username} is typing...`);
      }
    });

    socket.on('error', (error: { message: string }) => {
      showStatus(`Error: ${error.message}`, true);
    });
  };

  const sendMessage = () => {
    if (!message.trim() || !isConnected || !isJoined) return;

    socket.emit('sendMessage', {
      content: message,
      userId: userId
    });

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Chat Application
            </CardTitle>
            <CardDescription>
              Modern real-time chat with Socket.IO
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Connection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isJoined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(parseInt(e.target.value) || 0)}
                  disabled={isJoined}
                />
              </div>
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button 
                  onClick={joinChat} 
                  disabled={isJoined}
                  className="w-full"
                >
                  {isJoined ? 'Joined' : 'Join Chat'}
                </Button>
              </div>
            </div>

            {/* Status */}
            {status && (
              <div className={`p-3 rounded-lg ${status.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {status.message}
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Online Users */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Online Users ({onlineUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  {onlineUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No users online</p>
                  ) : (
                    <div className="space-y-2">
                      {onlineUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </Avatar>
                          <span className="text-sm">{user.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center">Welcome! Join the chat to start messaging.</p>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={index} className={`${msg.isSystem ? 'text-center' : ''}`}>
                          {msg.isSystem ? (
                            <div className="flex items-center justify-center gap-2">
                              {msg.content.includes('joined') ? (
                                <UserPlus className="w-3 h-3 text-green-500" />
                              ) : msg.content.includes('left') ? (
                                <UserMinus className="w-3 h-3 text-red-500" />
                              ) : null}
                              <Badge variant="secondary" className="text-xs">
                                {msg.content}
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                  {msg.user.username.charAt(0).toUpperCase()}
                                </div>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{msg.user.username}</span>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm">
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!isConnected || !isJoined}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!isConnected || !isJoined || !message.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">How to use:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>First create a user using the REST API or use an existing user ID</li>
                  <li>Enter username and user ID, then click "Join Chat"</li>
                  <li>Start sending messages!</li>
                  <li>Open multiple browser tabs to test multiple users</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-2">REST API Endpoints:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li><code className="bg-gray-100 px-1 rounded">POST /users</code> - Create user: <code className="bg-gray-100 px-1 rounded">{`{"username": "testuser"}`}</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">GET /users</code> - Get all users</li>
                  <li><code className="bg-gray-100 px-1 rounded">GET /messages/recent</code> - Get recent messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
