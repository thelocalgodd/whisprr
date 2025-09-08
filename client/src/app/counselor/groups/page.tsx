"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Search, Send, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface User {
  _id: string;
  username: string;
  role?: "user" | "counselor";
  isVerified?: boolean;
}

interface Message {
  _id: string;
  sender: User;
  text: string;
  time: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: number;
  avatar: string;
  messages: Message[];
}

export default function GroupsPage() {
  const [groups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedGroup) {
      setMessages(selectedGroup.messages);
    }
  }, [selectedGroup]);

  const handleSendMessage = async () => {
    if (selectedGroup && newMessage.trim()) {
      const message: Message = {
        _id: (messages.length + 1).toString(),
        sender: { _id: "currentUser", username: "Me" },
        text: newMessage.trim(),
        time: new Date().toISOString(),
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <div>{error}</div>;

  return (
    <Card className="w-full shadow-none h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        <div className="w-1/4 border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Groups</h2>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <Card
                  key={group._id}
                  className={`flex flex-col shadow-none py-4 border-none rounded-none border-b cursor-pointer w-full ${
                    selectedGroup?._id === group._id
                      ? "bg-accent"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No groups available.
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              <div className="px-4 py-2 border-b flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedGroup.avatar}
                    alt={selectedGroup.name}
                  />
                  <AvatarFallback>{selectedGroup.name[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-1">
                  <p className="font-semibold">{selectedGroup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroup.members} members
                  </p>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex mb-4 ${
                      msg.sender.username === "Me"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-2 py-1 rounded-lg max-w-xs ${
                        msg.sender.username === "Me"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm mb-1 w-full">{msg.text}</p>
                      <p
                        className={`text-xs ${
                          msg.sender.username === "Me"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="font-semibold text-xs mb-1 flex items-center gap-2">
                          {msg.sender.username}
                          {msg.sender.role === "counselor" && (
                            <BadgeCheck
                              className={`w-4 h-4 ${
                                msg.sender.isVerified
                                  ? "text-blue-500"
                                  : "text-gray-400"
                              }`}
                            />
                          )}
                          <span
                            className={`text-xs font-normal ${
                              msg.sender.username === "Me"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    className="pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-16 bg-primary text-primary-foreground"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No groups available or select a group to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
