import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import {
  MessageCircle,
  Send,
  MoreVertical,
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
} from "lucide-react";

// Firebase imports
import { auth, db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

export default function Chat() {
  // Currently selected conversation ID. The ID corresponds to a Firestore document ID.
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  // Conversations list populated from Firestore
  const [conversations, setConversations] = useState<any[]>([]);
  // Messages for the selected conversation
  const [messages, setMessages] = useState<any[]>([]);

  // Load conversations involving the current user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const convQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
    );
    const unsub = onSnapshot(convQuery, async (snapshot) => {
      const docs = snapshot.docs;
      const enriched: any[] = [];
      for (const docSnap of docs) {
        const convData: any = { id: docSnap.id, ...docSnap.data() };
        // Determine the other participant's ID and fetch their name if needed
        const otherId = Array.isArray(convData.participants)
          ? convData.participants.find((id) => id !== user.uid)
          : null;
        let displayName = convData.name;
        let displayAvatar = convData.avatar;
        if (otherId) {
          // If the stored name matches the current user's name or is missing, fetch from users collection
          try {
            const userSnap = await getDoc(doc(db, "users", otherId));
            if (userSnap.exists()) {
              const udata = userSnap.data();
              const fullName = `${udata.firstName ?? ""} ${udata.lastName ?? ""}`.trim();
              // Only override displayName if it's empty or equals the current user's name
              if (!displayName || displayName === (auth.currentUser?.displayName ?? "")) {
                displayName = fullName;
              }
              // Use initials as avatar fallback
              if (!displayAvatar) {
                const initials = (udata.firstName?.[0] ?? "").toUpperCase();
                displayAvatar = initials;
              }
            }
          } catch (err) {
            console.error("Failed to fetch user for conversation:", err);
          }
        }
        enriched.push({ ...convData, displayName, displayAvatar });
      }
      setConversations(enriched);
      // If no conversation is selected yet, select the first one
      if (!selectedChat && enriched.length > 0) {
        setSelectedChat(enriched[0].id);
      }
    });
    return () => unsub();
  }, []);

  // Load messages for the selected conversation
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }
    const messagesRef = collection(db, "conversations", selectedChat, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setMessages(data);
    });
    return () => unsub();
  }, [selectedChat]);

  const selectedConversation = conversations.find((c) => c.id === selectedChat) ?? null;

  // Send a new chat message to Firestore
  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user || !selectedChat || !newMessage.trim()) return;
    try {
      const messagesRef = collection(db, "conversations", selectedChat, "messages");
      await addDoc(messagesRef, {
        senderId: user.uid,
        content: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      // Update the conversation's last message for the sidebar preview
      const convRef = doc(db, "conversations", selectedChat);
      await setDoc(
        convRef,
        {
          lastMessage: newMessage.trim(),
          lastSenderId: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="chat" />
      
      <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat === conversation.id ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => setSelectedChat(conversation.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {/* Fall back to the other user's initials if no avatar field is provided */}
                            {conversation.displayAvatar ?? conversation.avatar ?? conversation.otherUserAvatar ?? conversation.partnerAvatar ?? ""}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {/* Use the conversation name if present, otherwise fall back to the partner's name */}
                            {conversation.displayName ?? conversation.name ?? conversation.otherUserName ?? conversation.partnerName ?? "Unnamed"}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {/* Format the last updated timestamp if available */}
                            {conversation.updatedAt && typeof conversation.updatedAt.toDate === "function"
                              ? conversation.updatedAt.toDate().toLocaleString()
                              : ""}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage ?? "No messages yet"}
                          </p>
                          {conversation.unread && conversation.unread > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {conversation.compatibility}% match
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="sm" className="lg:hidden">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {selectedConversation.displayAvatar ?? selectedConversation.avatar ?? selectedConversation.otherUserAvatar ?? selectedConversation.partnerAvatar ?? ""}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.displayName ?? selectedConversation.name ?? selectedConversation.otherUserName ?? selectedConversation.partnerName ?? "Unnamed"}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedConversation.online ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                          <span>{selectedConversation.online ? "Online" : "Offline"}</span>
                          <span>•</span>
                          {selectedConversation.compatibility ? (
                            <span>{selectedConversation.compatibility}% match</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action icons have been simplified; call and video features removed */}
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isMe = message.senderId === auth.currentUser?.uid;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMe ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {message.createdAt && typeof message.createdAt.toDate === "function"
                              ? message.createdAt
                                  .toDate()
                                  .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Schedule Meeting</h4>
              <p className="text-sm text-gray-600">Meet your potential roommate in person</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Share Locations</h4>
              <p className="text-sm text-gray-600">Show housing options you've found</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Make it Official</h4>
              <p className="text-sm text-gray-600">Confirm your roommate partnership</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
