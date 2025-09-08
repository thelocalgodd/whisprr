"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Heart,
  MessageCircle,
  Volume2,
  VolumeX,
} from "lucide-react";

type UserRole = "sharer" | "listener" | null;
type ConnectionStatus = "idle" | "searching" | "connected" | "disconnected";

function Voice() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const [connectedUser, setConnectedUser] = useState<{
    id: string;
    role: UserRole;
  } | null>(null);
  const [timeConnected, setTimeConnected] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Timer for connection duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectionStatus === "connected") {
      interval = setInterval(() => {
        setTimeConnected((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeConnected(0);
    }
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      return false;
    }
  };

  const startMatching = async (role: UserRole) => {
    if (!role) return;

    const audioPermission = await initializeAudio();
    if (!audioPermission) {
      alert("Microphone access is required for voice chat");
      return;
    }

    setUserRole(role);
    setConnectionStatus("searching");

    // Simulate matching process
    setTimeout(() => {
      setConnectedUser({
        id: `user_${Math.random().toString(36).substr(2, 9)}`,
        role: role === "sharer" ? "listener" : "sharer",
      });
      setConnectionStatus("connected");
    }, 2000 + Math.random() * 3000);
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setConnectionStatus("idle");
    setUserRole(null);
    setConnectedUser(null);
    setTimeConnected(0);
    setIsMuted(false);
    setIsListening(true);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  if (connectionStatus === "idle") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Anonymous Voice Chat</h1>
          <p className="text-muted-foreground text-lg">
            Connect with someone who needs to talk or listen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-200 dark:hover:border-blue-800"
            onClick={() => startMatching("sharer")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900 w-fit">
                <MessageCircle className="size-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">I want to share</CardTitle>
              <CardDescription>
                Talk about what&rsquo;s on your mind with a caring listener
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Express your thoughts and feelings</li>
                <li>• Get support from an active listener</li>
                <li>• Completely anonymous and safe</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-200 dark:hover:border-green-800"
            onClick={() => startMatching("listener")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900 w-fit">
                <Heart className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">I want to listen</CardTitle>
              <CardDescription>
                Provide support by listening to someone who needs to talk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Be a supportive presence</li>
                <li>• Help someone feel heard</li>
                <li>• Make a positive difference</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground">
                Choose your role, get matched instantly with someone who
                complements your needs, and have a meaningful anonymous
                conversation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (connectionStatus === "searching") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            </div>
            <CardTitle className="text-2xl">
              Finding your {userRole === "sharer" ? "listener" : "sharer"}...
            </CardTitle>
            <CardDescription>
              {userRole === "sharer"
                ? "Looking for someone who wants to listen and support you"
                : "Looking for someone who needs to share and talk"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="size-4" />
              <span>Finding your perfect match...</span>
            </div>
            <Button variant="outline" onClick={endCall}>
              Cancel Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Voice Chat - You&rsquo;re the {userRole}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Connected: {formatTime(timeConnected)}</span>
          <span>•</span>
          <span>
            {userRole === "sharer"
              ? "Talking to a listener"
              : "Listening to a sharer"}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900 w-fit">
              <MessageCircle className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>You ({userRole})</CardTitle>
            <CardDescription>
              {userRole === "sharer"
                ? "Sharing your thoughts"
                : "Providing support"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
              <Button
                variant={isListening ? "outline" : "secondary"}
                size="icon"
                onClick={toggleListening}
              >
                {isListening ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isMuted ? "Microphone muted" : "Microphone active"}
            </p>
            <Button variant="destructive" onClick={endCall} className="w-full">
              <PhoneOff className="size-4 mr-2" />
              End Chat
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900 w-fit">
              <Heart className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Anonymous {connectedUser?.role}</CardTitle>
            <CardDescription>
              {connectedUser?.role === "listener"
                ? "Here to listen and support"
                : "Sharing their thoughts"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Voice activity detected
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Chat Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ Do:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Be respectful and kind</li>
                <li>• Listen actively and empathetically</li>
                <li>• Keep conversations confidential</li>
                <li>• End the chat if you feel uncomfortable</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">❌ Don&rsquo;t:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Share personal identifying information</li>
                <li>• Use inappropriate language</li>
                <li>• Give medical or legal advice</li>
                <li>• Record or share conversations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Voice;
