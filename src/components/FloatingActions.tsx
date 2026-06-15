"use client";

import React, { useState } from "react";
import { MessageSquare, PhoneCall, MessageCircle, X, Plus } from "lucide-react";

interface FloatingActionsProps {
  settings: any;
}

export default function FloatingActions({ settings }: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNum = settings?.whatsapp?.replace(/\s+/g, "") || "+919443212345";
  const phoneNum = settings?.phone?.replace(/\s+/g, "") || "+919443212345";
  const defaultMsg = encodeURIComponent("Hi, I want to book an appointment at Sugam Child & Gastro Care Clinic.");

  const waUrl = `https://wa.me/${whatsappNum}?text=${defaultMsg}`;
  const callUrl = `tel:${phoneNum}`;

  return (
    <>
      {/* Mobile Radial Menu Container */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        {/* Background Overlay when open */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-brand-ink/10 backdrop-blur-[2px] transition-opacity"
            style={{ zIndex: -1 }}
            onClick={() => setIsOpen(false)}
          />
        )}
        
        {/* The Action Buttons */}
        <div className="absolute bottom-0 right-0 w-14 h-14 flex items-center justify-center">
          {/* Chatbot Action (Top) */}
          <button
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("toggle-chatbot"));
            }}
            className={`absolute w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isOpen ? "-translate-y-[85px] opacity-100 scale-100" : "translate-y-0 opacity-0 scale-50 pointer-events-none"
            }`}
            aria-label="Open Chatbot"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          {/* Call Action (Diagonal) */}
          <a
            href={callUrl}
            onClick={() => setIsOpen(false)}
            className={`absolute w-12 h-12 bg-pink text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 delay-75 ${
              isOpen ? "-translate-y-[60px] -translate-x-[60px] opacity-100 scale-100" : "translate-y-0 translate-x-0 opacity-0 scale-50 pointer-events-none"
            }`}
            aria-label="Call Emergency"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </a>

          {/* WhatsApp Action (Left) */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className={`absolute w-12 h-12 bg-teal text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 delay-150 ${
              isOpen ? "-translate-x-[85px] opacity-100 scale-100" : "translate-x-0 opacity-0 scale-50 pointer-events-none"
            }`}
            aria-label="WhatsApp Chat"
          >
            <MessageSquare className="w-5 h-5 fill-white" />
          </a>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 w-14 h-14 bg-teal hover:bg-teal-dark text-white rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 ${
            isOpen ? "rotate-[135deg]" : "rotate-0"
          }`}
          aria-label="Toggle Menu"
        >
          <Plus className="w-6 h-6" />
          {/* Ping indicator if closed */}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-pink rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          )}
        </button>
      </div>

      {/* Desktop/Tablet Docked Vertical Sidebar on the Right Edge */}
      <div className="hidden sm:flex flex-col items-center gap-4 fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white/30 backdrop-blur-lg border-l border-y border-white/20 shadow-2xl rounded-l-2xl py-5 px-3 w-16">
        
        {/* Vertical Text Label */}
        <div className="[writing-mode:vertical-rl] rotate-180 font-heading font-black tracking-widest text-[9px] text-brand-muted uppercase select-none mb-3 whitespace-nowrap">
          Sugam Connect
        </div>

        {/* Action Button 1: Emergency Call (Pink) */}
        <a
          href={callUrl}
          className="w-10 h-10 rounded-xl bg-pink hover:bg-pink-hover text-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          title="Call Clinic Emergency"
        >
          <PhoneCall className="w-4.5 h-4.5 animate-pulse" />
        </a>

        {/* Action Button 2: Chatbot Assistant (Green) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-chatbot"))}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          title="Chat with Assistant"
        >
          <MessageCircle className="w-4.5 h-4.5" />
        </button>

        {/* Action Button 3: WhatsApp Support (Teal) */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-xl bg-teal hover:bg-teal-dark text-white flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          title="WhatsApp Chat"
        >
          <MessageSquare className="w-4.5 h-4.5 fill-white text-teal" />
        </a>

      </div>
    </>
  );
}
