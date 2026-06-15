"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Save, X } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { useAdminFeedback } from "@/components/AdminFeedback";

import { useAdminData } from "@/components/AdminDataProvider";

export default function AdminBlogsPage() {
  const { confirm, notify } = useAdminFeedback();
  const { blogs: contextBlogs, loadingBlogs: contextLoading, fetchBlogs } = useAdminData();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form / Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General Health",
    image: "",
    author: "Sugam Specialist",
    tagsString: "",
  });

  useEffect(() => {
    if (contextBlogs && contextBlogs.length > 0) {
      setBlogs(contextBlogs);
      setLoading(false);
    } else if (!contextLoading) {
      setBlogs([]);
      setLoading(false);
    }
  }, [contextBlogs, contextLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      title: "",
      content: "",
      category: "General Health",
      image: "",
      author: "Sugam Specialist",
      tagsString: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (post: any) => {
    setEditId(post._id);
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category || "General Health",
      image: post.image || "",
      author: post.author || "Sugam Specialist",
      tagsString: post.tags ? post.tags.join(", ") : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const tags = formData.tagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      image: formData.image,
      author: formData.author,
      tags,
    };

    try {
      const method = editId ? "PUT" : "POST";
      const bodyPayload = editId ? { ...payload, id: editId } : payload;

      const res = await fetch("/api/blog", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) throw new Error("Failed to save blog post");
      setShowModal(false);
      fetchBlogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete blog article?",
      message: "This permanently removes the blog article. This cannot be undone.",
      confirmText: "Delete",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/blog?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      fetchBlogs();
      notify("success", "Blog article deleted.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete the blog article.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-800">Health Tips Blog</h1>
          <p className="text-sm text-slate-500 mt-1">Publish informative guidelines, newborn tips, and dietary recommendations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-teal hover:bg-teal-dark text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Publish Article</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white p-12 border border-slate-200 rounded-3xl text-center text-slate-400">
          No blog articles published yet. Publish your first tip today!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map((post) => (
            <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="bg-teal-tint text-teal-dark text-[10px] font-bold px-3 py-1 rounded-full border border-teal/10 uppercase">
                    {post.category}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(post)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(post._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-lg text-slate-800 leading-snug line-clamp-2">{post.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5">By {post.author} on {new Date(post.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-4 line-clamp-4">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-heading font-bold text-lg">{editId ? "Edit Article" : "Write Health Tips Article"}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Article Title</label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Newborn Feeding Routines"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <input
                    type="text"
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Pediatric Gastro"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Author</label>
                  <input
                    type="text"
                    required
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <ImageUploader
                    value={formData.image}
                    onChange={(val) => setFormData((prev) => ({ ...prev, image: val }))}
                    label="Feature Image"
                    aspectRatio="video"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tags (separated by commas)</label>
                  <input
                    type="text"
                    name="tagsString"
                    value={formData.tagsString}
                    onChange={handleInputChange}
                    placeholder="newborn, nutrition, milestones"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Article Content / Body</label>
                <textarea
                  required
                  name="content"
                  rows={8}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal text-sm text-slate-800 whitespace-pre-wrap"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-teal hover:bg-teal-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Publish</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
