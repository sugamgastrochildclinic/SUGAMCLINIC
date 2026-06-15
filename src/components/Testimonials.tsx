"use client";

import React, { useState } from "react";
import { Star, Quote, Send, Sparkles, CheckCircle2, MessageSquare } from "lucide-react";
import { translations, Language } from "@/lib/translations";

interface TestimonialsProps {
  reviews: any[];
  lang: Language;
}

const formTranslations = {
  en: {
    leftTitle: "We Value Your Feedback",
    leftDesc: "Your reviews help us refine our clinical care, child-friendly facilities, and patient response systems. Every feedback is valuable to our medical team.",
    leftStat1: "15+ Years of Care",
    leftStat2: "10k+ Happy Children",
    leftStat3: "Verified Patient Reviews",
    formTitle: "Share Your Experience",
    formDesc: "Let other parents and patients know about the care you received.",
    labelName: "Your Full Name",
    labelRating: "Select Rating",
    labelReview: "Your Review / Feedback",
    placeholderName: "e.g. Anitha Kumar",
    placeholderReview: "Tell us about your experience...",
    btnSubmit: "Submit Review for Verification",
    btnSubmitting: "Submitting review...",
    successTitle: "Review Submitted!",
    successDesc: "Thank you for sharing your feedback. Your review has been saved and will appear in our marquee once verified by the clinic admin.",
    successBtn: "Write Another Review",
  },
  ta: {
    leftTitle: "உங்கள் கருத்துக்கள் எங்களின் தூண்",
    leftDesc: "உங்கள் மேலான கருத்துக்கள் எங்களது மருத்துவச் சேவை, குழந்தைகள் உகந்த வசதிகள் மற்றும் பொறுப்பான அணுகுமுறைகளை மேலும் மேம்படுத்த உதவுகின்றன.",
    leftStat1: "15+ வருட அனுபவம்",
    leftStat2: "10,000+ குழந்தைகள் நலம்",
    leftStat3: "உறுதிப்படுத்தப்பட்ட கருத்துக்கள்",
    formTitle: "உங்கள் அனுபவத்தைப் பகிரவும்",
    formDesc: "மற்ற பெற்றோர்களும் நோயாளிகளும் உங்களது அனுபவத்தைப் பற்றி அறிந்து கொள்ள உதவுங்கள்.",
    labelName: "உங்கள் பெயர்",
    labelRating: "மதிப்பீடு",
    labelReview: "கருத்து / திருப்தி விவரம்",
    placeholderName: "எ.கா. அனிதா குமார்",
    placeholderReview: "மருத்துவமனை அனுபவம் பற்றி எழுதுங்கள்...",
    btnSubmit: "கருத்தைச் சமர்ப்பிக்கவும்",
    btnSubmitting: "சமர்ப்பிக்கப்படுகிறது...",
    successTitle: "கருத்து சமர்ப்பிக்கப்பட்டது!",
    successDesc: "உங்கள் மேலான கருத்துக்கு நன்றி. உங்கள் கருத்து சேமிக்கப்பட்டது, நிர்வாகியால் சரிபார்க்கப்பட்டதும் முகப்பு பக்கத்தில் காட்டப்படும்.",
    successBtn: "மற்றொரு கருத்து எழுத",
  },
  ml: {
    leftTitle: "ഞങ്ങൾ നിങ്ങളുടെ അഭിപ്രായങ്ങളെ വിലമതിക്കുന്നു",
    leftDesc: "നിങ്ങളുടെ അഭിപ്രായങ്ങൾ ഞങ്ങളുടെ പരിചരണവും ശിശുസൗഹൃദ സൗകര്യങ്ങളും കൂടുതൽ മെച്ചപ്പെടുത്താൻ സഹായിക്കുന്നു.",
    leftStat1: "15+ വർഷത്തെ പരിചയം",
    leftStat2: "10k+ കുട്ടികളുടെ പരിചരണം",
    leftStat3: "സ്ഥിരീകരിച്ച പ്രതികരണങ്ങൾ",
    formTitle: "അനുഭവം പങ്കുവെക്കൂ",
    formDesc: "നിങ്ങൾക്ക് ലഭിച്ച മികച്ച പരിചരണത്തെക്കുറിച്ച് മറ്റുള്ളവരോട് പറയുക.",
    labelName: "നിങ്ങളുടെ പേര്",
    labelRating: "റേറ്റിംഗ്",
    labelReview: "നിങ്ങളുടെ അഭിപ്രായം",
    placeholderName: "ഉദാ: അനിത കുമാർ",
    placeholderReview: "അനുഭവങ്ങൾ എഴുതുക...",
    btnSubmit: "അഭിപ്രായം സമർപ്പിക്കുക",
    btnSubmitting: "സമർപ്പിക്കുന്നു...",
    successTitle: "അഭിപ്രായം സമർപ്പിച്ചു!",
    successDesc: "നിങ്ങളുടെ വിലയേറിയ പ്രതികരണത്തിന് നന്ദി. അഡ്മിൻ അംഗീകരിച്ച ശേഷം ഇത് വെബ്‌സൈറ്റിൽ കാണിക്കും.",
    successBtn: "മറ്റൊന്ന് എഴുതുക",
  },
  kn: {
    leftTitle: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆ ನಮಗೆ ಮುಖ್ಯ",
    leftDesc: "ನಿಮ್ಮ ವಿಮರ್ಶೆಗಳು ನಮ್ಮ ಕ್ಲಿನಿಕ್ ವಾತಾವರಣ ಮತ್ತು ರೋಗಿಗಳ ಸೇವೆಯನ್ನು ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    leftStat1: "15+ ವರ್ಷಗಳ ಸೇವೆ",
    leftStat2: "10k+ ಮಂದಿ ಮಕ್ಕಳು",
    leftStat3: "ವೆರಿಫೈಡ್ ಪ್ರತಿಕ್ರಿಯೆಗಳು",
    formTitle: "ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ",
    formDesc: "ನಮ್ಮ ಸೇವೆಯ ಬಗ್ಗೆ ಇತರರಿಗೆ ತಿಳಿಸಲು ನಿಮ್ಮ ವಿಮರ್ಶೆಯನ್ನು ಬರೆಯಿರಿ.",
    labelName: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು",
    labelRating: "ರೇಟಿಂಗ್",
    labelReview: "ನಿಮ್ಮ ವಿಮರ್ಶೆ",
    placeholderName: "ಉದಾ: ಅನಿತಾ ಕೌಮಾರ್",
    placeholderReview: "ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಬರೆಯಿರಿ...",
    btnSubmit: "ಸಬ್ಮಿಟ್ ಮಾಡಿ",
    btnSubmitting: "ಸಬ್ಮಿಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    successTitle: "ಸಬ್ಮಿಟ್ ಯಶಸ್ವಿಯಾಗಿದೆ!",
    successDesc: "ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಗೆ ಧನ್ಯವಾದಗಳು. ಅಡ್ಮಿನ್ ಒಪ್ಪಿಗೆ ನೀಡಿದ ನಂತರ ಇದನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ.",
    successBtn: "ಮತ್ತೊಂದು ವಿಮರ್ಶೆ ಬರೆಯಿರಿ",
  },
  te: {
    leftTitle: "మీ అభిప్రాయం మాకు ముఖ్యం",
    leftDesc: "మీ సమీక్షలు మా చికిత్స నాణ్యత మరియు రోగుల సంరక్షణ వ్యవస్థలను మెరుగుపరచడంలో సహాయపడతాయి.",
    leftStat1: "15+ సంవత్సరాల అనుభవం",
    leftStat2: "10k+ పైగా పిల్లలు",
    leftStat3: "ధృవీకరించబడిన సమీక్షలు",
    formTitle: "మీ అనుభవాన్ని పంచుకోండి",
    formDesc: "క్లినిక్‌లో మీకు లభించిన సేవ గురించి ఇతరులకు తెలియజేయండి.",
    labelName: "మీ పూర్తి పేరు",
    labelRating: "రేటింగ్",
    labelReview: "మీ సమీక్ష / అనుభవం",
    placeholderName: "ఉదా: అనిత కుమార్",
    placeholderReview: "మీ అనుభవం రాయండి...",
    btnSubmit: "సమీక్షను సమర్పించండి",
    btnSubmitting: "సమర్పిస్తున్నాము...",
    successTitle: "సమీక్ష సమర్పించబడింది!",
    successDesc: "మీ అమూల్యమైన సమీక్షకు ధನ್ಯవాదాలు. అడ్మిన్ ఆమోదించిన తర్వాత వెబ్‌సైట్‌లో కనిపిస్తుంది.",
    successBtn: "మరో సమీక్ష రాయండి",
  },
  hi: {
    leftTitle: "आपकी प्रतिक्रिया हमारे लिए मूल्यवान है",
    leftDesc: "आपकी समीक्षाएं हमें हमारी चिकित्सा सेवाओं और बाल-अनुकूल व्यवस्थाओं को बेहतर बनाने में मदद करती हैं।",
    leftStat1: "15+ वर्षों का अनुभव",
    leftStat2: "10,000+ खुश बच्चे",
    leftStat3: "सत्यापित मरीज समीक्षाएं",
    formTitle: "अपना अनुभव साझा करें",
    formDesc: "हमारे क्लिनिक से मिले इलाज और व्यवहार के बारे में अपनी समीक्षा लिखें।",
    labelName: "आपका पूरा नाम",
    labelRating: "रेटिंग चुनें",
    labelReview: "आपकी समीक्षा / राय",
    placeholderName: "जैसे: अनीता कुमार",
    placeholderReview: "अपना अनुभव विस्तार से लिखें...",
    btnSubmit: "समीक्षा सबमिट करें",
    btnSubmitting: "सबमिट किया जा रहा है...",
    successTitle: "समीक्षा सबमिट हो गई!",
    successDesc: "अपनी प्रतिक्रिया साझा करने के लिए धन्यवाद। समीक्षा एडमिन के सत्यापन के बाद प्रदर्शित होगी।",
    successBtn: "एक और समीक्षा लिखें",
  }
};

export default function Testimonials({ reviews, lang }: TestimonialsProps) {
  const t = translations[lang];
  const f = formTranslations[lang] || formTranslations["en"];

  // Form states
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Duplicate the array to create a seamless infinite scrolling loop if there are reviews
  const hasReviews = reviews && reviews.length > 0;
  const scrollItems = hasReviews ? [...reviews, ...reviews, ...reviews, ...reviews] : [];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rating,
          reviewText,
          approved: false, // Explicitly false for visitor submits
        }),
      });

      if (!res.ok) throw new Error("Could not submit review");
      
      setName("");
      setRating(5);
      setReviewText("");
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to submit. Please try again.");
    }
  };

  return (
    <section id="reviews" className="py-24 bg-white border-b border-brand-border/40 relative overflow-hidden">
      {/* Desktop-only minimal background decoration */}
      <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none">
        {/* 1. Diagonal stripe band */}
        <div
          className="absolute top-0 right-0 w-[35%] h-full opacity-[0.05]"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              #ff70a6,
              #ff70a6 1.5px,
              transparent 1.5px,
              transparent 24px
            )`,
          }}
        />
        {/* 2. Top-left plus marker */}
        <div className="absolute top-[15%] left-[8%] flex flex-col items-center opacity-40">
          <div className="w-[2px] h-6 bg-teal/30 rounded-full" />
          <div className="w-6 h-[2px] bg-teal/30 rounded-full -mt-[13px]" />
        </div>
        {/* 3. Bottom-left subtle glow */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[25vw] h-[25vw] rounded-full bg-brand-blush/20 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink/10 text-pink-safe text-xs font-semibold mb-4">
            <Star className="w-4 h-4 fill-pink-safe text-pink-safe" />
            <span>{t.reviewsBadge}</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-brand-ink mb-4">
            {t.reviewsTitle}
          </h2>
          <p className="text-brand-muted text-sm sm:text-base">
            {t.reviewsDesc}
          </p>
        </div>
      </div>

      {/* Auto Scrolling Marquee Row - Constrained inside section width */}
      {hasReviews && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16">
          <div className="w-full overflow-hidden py-6 select-none relative flex rounded-3xl border border-brand-border bg-slate-50/20">
            {/* Left & Right Shadow Fade Overlays */}
            <div className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-white/95 to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-white/95 to-transparent z-10 pointer-events-none" />

            <div className="flex gap-6 whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
              {scrollItems.map((rev: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-brand-border/60 p-6 rounded-2xl shrink-0 w-[260px] sm:w-[300px] shadow-xs relative overflow-hidden flex flex-col justify-between whitespace-normal"
                >
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-teal/5 pointer-events-none" />
                  
                  <div>
                    {/* Rating Stars */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-pink text-pink shrink-0" />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-[11px] sm:text-xs text-brand-ink font-medium leading-relaxed italic mb-5">
                      "{rev.reviewText}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="border-t border-brand-border/40 pt-2.5 mt-auto">
                    <h4 className="font-heading font-bold text-xs text-brand-ink">
                      {rev.name}
                    </h4>
                    <p className="text-[9px] text-brand-muted mt-0.5">{t.reviewsVerified}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write a Review Submission Section - Equal Height Card Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Left card: Aesthetic commitment block */}
          <div className="bg-gradient-to-br from-brand-blush/80 via-white to-teal-tint/30 rounded-3xl p-8 sm:p-10 border border-brand-border flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-tint/40 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-blush/60 rounded-full blur-3xl" />
            
            <div className="relative space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-tint text-teal flex items-center justify-center border border-teal/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-2xl text-brand-ink leading-tight">
                {f.leftTitle}
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed">
                {f.leftDesc}
              </p>
            </div>

            {/* Micro highlights */}
            <div className="relative pt-8 grid grid-cols-3 gap-4 border-t border-brand-border/60 mt-8">
              <div>
                <span className="block font-heading font-bold text-teal text-lg sm:text-xl notranslate">15+</span>
                <span className="text-[10px] sm:text-xs text-brand-muted font-semibold">{f.leftStat1}</span>
              </div>
              <div>
                <span className="block font-heading font-bold text-pink-safe text-lg sm:text-xl notranslate">10k+</span>
                <span className="text-[10px] sm:text-xs text-brand-muted font-semibold">{f.leftStat2}</span>
              </div>
              <div>
                <span className="block font-heading font-bold text-teal text-lg sm:text-xl notranslate">100%</span>
                <span className="text-[10px] sm:text-xs text-brand-muted font-semibold">{f.leftStat3}</span>
              </div>
            </div>
          </div>

          {/* Right card: Submission Form */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-brand-border flex flex-col justify-between shadow-sm relative">
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-heading font-bold text-xl text-brand-ink">{f.successTitle}</h4>
                  <p className="text-sm text-brand-muted max-w-sm leading-relaxed mx-auto">
                    {f.successDesc}
                  </p>
                </div>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-teal hover:bg-teal-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {f.successBtn}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-heading font-bold text-xl text-brand-ink flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal" />
                    <span>{f.formTitle}</span>
                  </h3>
                  <p className="text-xs text-brand-muted mt-1">
                    {f.formDesc}
                  </p>
                </div>

                <div className="space-y-4 my-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-ink mb-1.5">{f.labelName}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={f.placeholderName}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink bg-slate-50/20"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-ink mb-1.5">{f.labelRating}</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = hoveredRating !== null ? star <= hoveredRating : star <= rating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors duration-150 ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-xs text-brand-muted font-bold ml-2">
                        {rating} / 5
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-brand-ink mb-1.5">{f.labelReview}</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder={f.placeholderReview}
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink bg-slate-50/20 resize-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-semibold mb-2">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? f.btnSubmitting : f.btnSubmit}</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
