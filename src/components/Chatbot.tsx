"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";

interface ChatbotProps {
  settings: any;
  doctors: any[];
}

interface Message {
  sender: "bot" | "user";
  text: string;
}

export default function Chatbot({ settings, doctors }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am Sugam Assistant. How can I help you today? You can ask me about our doctors, clinic timings, gastro services, pediatric consults, or how to book an appointment.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-chatbot", handleToggle);
    return () => window.removeEventListener("toggle-chatbot", handleToggle);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = "";

      if (lower.includes("doctor") || lower.includes("specialist") || lower.includes("who is")) {
        const docNames = doctors.map((d) => d.name).join(" and ");
        reply = `Our clinic features experienced specialists: ${docNames}. They consult in Pediatric Gastroenterology, Neonatology, and Hepatology.`;
      } else if (lower.includes("time") || lower.includes("hour") || lower.includes("when")) {
        reply = `Sugam Clinic working hours are: ${settings?.workingHours || "Mon - Sat: 9:00 AM - 1:00 PM, 5:00 PM - 8:30 PM"}.`;
      } else if (lower.includes("book") || lower.includes("appointment") || lower.includes("schedule")) {
        reply = "To book an appointment, you can scroll to our online 'Booking Form' on the webpage, click the WhatsApp button, or call us at " + (settings?.phone || "+91 94432 12345") + ".";
      } else if (lower.includes("gastro") || lower.includes("liver") || lower.includes("stomach") || lower.includes("acidity")) {
        reply = "We offer specialized Pediatric Gastroenterology & Hepatology treatments for stomach pain, acid reflux, vomiting, diarrhea, liver issues, and child growth tracking.";
      } else if (lower.includes("vaccin") || lower.includes("remind") || lower.includes("baby") || lower.includes("child")) {
        reply = "Yes! We specialize in newborn vaccinations and child developmental milestones. You can opt-in to receive automated email vaccination reminders in our booking form.";
      } else if (lower.includes("contact") || lower.includes("number") || lower.includes("phone") || lower.includes("email") || lower.includes("address")) {
        reply = `You can call us at ${settings?.phone || "+91 94432 12345"}, email us at ${settings?.email || "info@sugamclinic.com"}, or visit us at ${settings?.address || "our Clinic road location"}.`;
      } else {
        reply = "Thank you for asking. Our specialists treat all pediatric and gastrointestinal conditions. Please book a consultation online or call us at " + (settings?.phone || "+91 94432 12345") + " to get detailed clinical guidance.";
      }

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-48 right-6 w-[340px] sm:w-[380px] h-[480px] bg-white rounded-3xl border border-brand-border shadow-2xl z-40 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-teal p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm leading-tight">Sugam Assistant</h4>
                <p className="text-[10px] text-teal-tint font-medium">Online | AI Inquiry Agent</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-cream/10">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-pink text-white" : "bg-teal-tint text-teal-dark border border-teal/20"
                  }`}>
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${msg.sender === "user"
                    ? "bg-pink text-white rounded-tr-none"
                    : "bg-white border border-brand-border text-brand-ink rounded-tl-none shadow-sm"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-brand-border p-3.5 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-teal" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-brand-border bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ask me something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-xl focus:outline-none focus:border-teal text-xs text-brand-ink"
            />
            <button
              onClick={handleSend}
              className="bg-teal hover:bg-teal-dark text-white p-2.5 rounded-xl transition-colors shadow-sm active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
