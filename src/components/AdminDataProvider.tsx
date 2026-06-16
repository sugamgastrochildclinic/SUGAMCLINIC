"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminDataContextType {
  settings: any;
  loadingSettings: boolean;
  fetchSettings: () => Promise<void>;
  
  doctors: any[];
  loadingDoctors: boolean;
  fetchDoctors: () => Promise<void>;
  
  gallery: any[];
  loadingGallery: boolean;
  fetchGallery: () => Promise<void>;
  
  blogs: any[];
  loadingBlogs: boolean;
  fetchBlogs: () => Promise<void>;
  
  services: any[];
  loadingServices: boolean;
  fetchServices: () => Promise<void>;

  appointments: any[];
  loadingAppointments: boolean;
  fetchAppointments: () => Promise<void>;

  reviews: any[];
  loadingReviews: boolean;
  fetchReviews: () => Promise<void>;

  messages: any[];
  loadingMessages: boolean;
  fetchMessages: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setDoctors(data);
      }
    } catch (err) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setGallery(data);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoadingGallery(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBlogs(data);
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setServices(data);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        // API now returns a { data, page, limit, total } envelope; tolerate the
        // legacy bare-array shape too.
        const list = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(list)) setAppointments(list);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setReviews(data);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Pre-load all critical admin data on mount
  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchDoctors(),
      fetchGallery(),
      fetchBlogs(),
      fetchServices(),
      fetchAppointments(),
      fetchReviews(),
      fetchMessages()
    ]).catch(err => console.error("Initial context loading failed:", err));
  }, []);

  return (
    <AdminDataContext.Provider
      value={{
        settings,
        loadingSettings,
        fetchSettings,
        doctors,
        loadingDoctors,
        fetchDoctors,
        gallery,
        loadingGallery,
        fetchGallery,
        blogs,
        loadingBlogs,
        fetchBlogs,
        services,
        loadingServices,
        fetchServices,
        appointments,
        loadingAppointments,
        fetchAppointments,
        reviews,
        loadingReviews,
        fetchReviews,
        messages,
        loadingMessages,
        fetchMessages
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
}
