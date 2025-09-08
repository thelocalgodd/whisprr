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
  Shield,
} from "lucide-react";

type UserRole = "counselor" | "client" | null;
type ConnectionStatus = "idle" | "searching" | "connected" | "disconnected";

function CounselorVoice() {
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

  const startCounselingSession = async () => {
    const audioPermission = await initializeAudio();
    if (!audioPermission) {
      alert("Microphone access is required for voice counseling");
      return;
    }

    setUserRole("counselor");
    setConnectionStatus("searching");

    // Simulate matching with a client
    setTimeout(() => {
      setConnectedUser({
        id: `client_${Math.random().toString(36).substr(2, 9)}`,
        role: "client",
      });
      setConnectionStatus("connected");
    }, 1500 + Math.random() * 2500);
  };

  const endSession = () => {
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
          <h1 className="text-3xl font-bold mb-2">
            Professional Voice Counseling
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Provide support through anonymous voice sessions
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-200 dark:hover:border-blue-800"
            onClick={startCounselingSession}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-6 rounded-full bg-blue-100 dark:bg-blue-900 w-fit">
                <Heart className="size-12 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">
                Start Counseling Session
              </CardTitle>
              <CardDescription className="text-lg">
                Connect with someone who needs professional support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-600">
                    Session Features:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Anonymous and confidential</li>
                    <li>• Professional-grade audio quality</li>
                    <li>• Session duration tracking</li>
                    <li>• Crisis intervention protocols</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-600">
                    Your Role:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Provide empathetic listening</li>
                    <li>• Offer professional guidance</li>
                    <li>• Maintain therapeutic boundaries</li>
                    <li>• Document session insights</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Button size="lg" className="px-8">
                  <MessageCircle className="size-5 mr-2" />
                  Begin Session
                </Button>
              </div>
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
              Connecting with a client...
            </CardTitle>
            <CardDescription>
              Finding someone who needs professional support and guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={endSession}>
              Cancel Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Counseling Session - You're providing support
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>Session Duration: {formatTime(timeConnected)}</span>
          <span>•</span>
          <span>Client ID: {connectedUser?.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Counselor Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900 w-fit">
              <Shield className="size-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>You (Counselor)</CardTitle>
            <CardDescription>Providing professional support</CardDescription>
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
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </div>
            <CardTitle>Session Active</CardTitle>
            <CardDescription>
              Professional counseling in progress
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              variant="destructive"
              onClick={endSession}
              className="w-full"
            >
              <PhoneOff className="size-4 mr-2" />
              End Session
            </Button>
          </CardContent>
        </Card>

        {/* Client Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-green-100 dark:bg-green-900 w-fit">
              <MessageCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Anonymous Client</CardTitle>
            <CardDescription>Seeking support and guidance</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Client is speaking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Professional Guidelines */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Professional Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">
                ✅ Therapeutic Approach:
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Practice active listening</li>
                <li>• Show empathy and validation</li>
                <li>• Ask open-ended questions</li>
                <li>• Reflect client emotions</li>
                <li>• Maintain professional boundaries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-yellow-600">
                ⚠️ Crisis Protocols:
              </h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Assess suicide/harm risk</li>
                <li>• Use de-escalation techniques</li>
                <li>• Connect to emergency resources</li>
                <li>• Document crisis interventions</li>
                <li>• Follow up appropriately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-red-600">❌ Avoid:</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• Giving medical advice</li>
                <li>• Making promises you can't keep</li>
                <li>• Sharing personal information</li>
                <li>• Diagnosing conditions</li>
                <li>• Recording sessions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CounselorVoice;
