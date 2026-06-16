import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import Doctor from "@/models/Doctor";
import Service from "@/models/Service";
import Review from "@/models/Review";
import FAQ from "@/models/FAQ";
import BlogPost from "@/models/BlogPost";
import Gallery from "@/models/Gallery";

export async function seedDatabase() {
  await connectToDatabase();

  // 1. Settings Seeding
  let settings = await ClinicSettings.findOne();
  if (!settings) {
    settings = await ClinicSettings.create({
      clinicName: "Sugam Child & Gastro Care Clinic",
      tagline: "Expert Pediatric, Neonatal & Gastroenterology care in Venkittapuram, Coimbatore",
      address: "Sugam Child & Gastro Care Clinic, Ambethkar Road, Near Sindhi Vidyalaya, Venkittapuram, Coimbatore, Tamil Nadu 641025",
      phone: "+91 94432 12345",
      email: "contact@sugamclinic.com",
      whatsapp: "+91 94432 12345",
      mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5709971936357!2d80.21852877593259!3d13.062402113203498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267b14dcd69eb%3A0xe54e604f3263a2!2sApollo%20Children&#39;s%20Hospitals!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
      workingHours: "Mon - Sat: 9:00 AM - 1:00 PM, 5:00 PM - 8:30 PM",
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      linkedin: "https://linkedin.com",
      seoTitle: "Sugam Child & Gastro Care Clinic - Pediatric & Gastroenterology Experts",
      seoDescription: "Sugam Clinic provides premium pediatric care, neonatology, child gastroenterology, and liver care services by expert doctors.",
      seoKeywords: "pediatrician, gastro care, neonatology, child specialist, liver clinic",
    });
  }

  // 2. Doctors Seeding
  const doctorCount = await Doctor.countDocuments();
  if (doctorCount === 0) {
    await Doctor.create([
      {
        name: "Dr. S. Karthik, MD (Peds), DM (Gastro)",
        qualification: "MD (Pediatrics), DM (Gastroenterology), Fellowship in Pediatric Hepatology",
        specialization: "Pediatric Gastroenterologist & Hepatologist",
        experience: 15,
        description: "Dr. Karthik has over 15 years of experience treating pediatric gastrointestinal disorders, newborn digestive complications, and complex pediatric liver diseases.",
        consultingTime: "Mon - Sat: 10:00 AM - 1:00 PM, 5:00 PM - 8:00 PM",
        phone: "+91 94432 12345",
        availability: "Available Today",
      },
      {
        name: "Dr. A. Meera, MD (Peds), DCH",
        qualification: "MD (Pediatrics), DCH, Fellowship in Neonatology",
        specialization: "Senior Pediatrician & Neonatologist",
        experience: 12,
        description: "Dr. Meera is an expert in newborn intensive care, childhood vaccinations, growth tracking, and adolescent nutrition consultation.",
        consultingTime: "Mon - Sat: 9:00 AM - 12:00 PM, 6:00 PM - 8:30 PM",
        phone: "+91 94432 54321",
        availability: "Available Today",
      }
    ]);
  }

  // 3. Services Seeding
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    await Service.create([
      {
        title: "Pediatric Consultation",
        description: "Comprehensive health checkups for infants, children, and teens with milestone tracking.",
        icon: "Baby",
      },
      {
        title: "Neonatology & Newborn Care",
        description: "Expert care for premature babies, newborn jaundice, feeding issues, and postnatal support.",
        icon: "ShieldAlert",
      },
      {
        title: "Pediatric Gastroenterology",
        description: "Advanced diagnostics and treatment for childhood stomach pain, acid reflux, and diarrhea.",
        icon: "Activity",
      },
      {
        title: "Liver Care & Hepatology",
        description: "Specialized clinical care for childhood liver disorders, hepatitis, and metabolic issues.",
        icon: "Heart",
      },
      {
        title: "Vaccination Clinic",
        description: "All essential and optional vaccinations following national immunization schedules.",
        icon: "Syringe",
      },
      {
        title: "Nutrition & Diet Counseling",
        description: "Customized nutrition guides for growth failure, picky eaters, and obesity management.",
        icon: "Apple",
      }
    ]);
  }

  // 4. Testimonials Seeding
  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0) {
    await Review.create([
      {
        name: "Ramesh Kumar",
        rating: 5,
        reviewText: "The doctors at Sugam Clinic are very gentle and patient. My son was suffering from gastro issues for weeks, and their treatment showed immediate results.",
        approved: true,
      },
      {
        name: "Priyanka S.",
        rating: 5,
        reviewText: "Excellent care for newborns. Dr. Meera answered all my queries regarding breastfeeding and neonatal vaccines. Highly recommended!",
        approved: true,
      }
    ]);
  }

  // 5. FAQs Seeding
  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.create([
      {
        question: "What are the clinic timings?",
        answer: "The clinic operates from Monday to Saturday, 9:00 AM to 1:00 PM and 5:00 PM to 8:30 PM. On Sundays, we are open from 10:00 AM to 2:00 PM.",
      },
      {
        question: "How do I book an appointment?",
        answer: "You can book directly using the online booking form on our website, click the WhatsApp button for direct booking, or call us at the clinic number.",
      },
      {
        question: "Do you offer vaccination reminders?",
        answer: "Yes, when you schedule an appointment or register, you can opt-in to our Vaccination Reminder System to receive email reminders for your child's schedule.",
      },
      {
        question: "Is there parking space near the clinic?",
        answer: "Yes, we have dedicated two-wheeler parking in front of the clinic building, and ample four-wheeler parking spaces along the hospital road lane.",
      }
    ]);
  }

  // 6. Blogs Seeding
  const blogCount = await BlogPost.countDocuments();
  if (blogCount === 0) {
    await BlogPost.create([
      {
        title: "Newborn Care Tips for First-Time Parents",
        content: "Welcoming a newborn is a joyous event but can be overwhelming. Standard tips include prioritizing clean hygiene, tracking wet diapers (should be 6-8 per day), managing room temperature (24-26°C), and observing growth milestones. Contact our pediatric specialists if you notice persistent feeding issues or baby lethargy.",
        category: "Newborn Care",
        tags: ["Newborn", "Infants", "Parenting"],
      },
      {
        title: "Understanding Childhood Acid Reflux",
        content: "Childhood acid reflux or spitting up is extremely common in infants due to an immature esophageal sphincter. Feeding in an upright position, giving smaller but more frequent feeds, and keeping the baby upright for 30 minutes after feeding can help reduce symptoms.",
        category: "Gastroenterology",
        tags: ["Gastro", "Acid Reflux", "Child Health"],
      }
    ]);
  }

  // 7. Gallery Seeding
  const galleryCount = await Gallery.countDocuments({ category: "gallery" });
  if (galleryCount === 0) {
    await Gallery.create([
      {
        imageUrl: "https://ik.imagekit.io/sugamclinic/waiting-area.jpg",
        category: "gallery",
        caption: "Child-friendly Waiting Area",
        order: 1,
      },
      {
        imageUrl: "https://ik.imagekit.io/sugamclinic/consulting-room.jpg",
        category: "gallery",
        caption: "Doctor's Consultation Room",
        order: 2,
      },
      {
        imageUrl: "https://ik.imagekit.io/sugamclinic/diagnostic-tools.jpg",
        category: "gallery",
        caption: "Advanced Pediatric Diagnostics",
        order: 3,
      }
    ]);
  }
}
