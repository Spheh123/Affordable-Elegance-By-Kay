window.SALON_SEED = {
  business: {
    name: "Affordable Elegance by Kay",
    phone: "081 666 4395",
    whatsapp: "081 666 4395",
    instagram: "@elegant_luxe_by_kay",
    facebook: "@affordableelegancebykay",
    tiktok: "@affordableelegancebykay",
    bannerNotice: "Spring Special valid till 30 September",
    cashNotice: "We no longer accept cash payments due to counterfeit banknotes. EFT only.",
    paymentWindowMinutes: 15,
    depositPercentage: 50,
    bank: {
      name: "Capitec Bank",
      accountHolder: "Mrs PK Bisaso",
      accountNumber: "1726218692",
      linkedMobile: "0824950500"
    }
  },
  branches: [
    {
      id: "johannesburg",
      name: "Johannesburg Branch",
      address: "58 Kruis Street, The Markade, 6th Floor, Unit 617S, Johannesburg",
      phone: "081 666 4395",
      opening: { mon: ["09:00", "17:00"], tue: ["09:00", "17:00"], wed: ["09:00", "17:00"], thu: ["09:00", "17:00"], fri: ["08:00", "17:00"], sat: ["08:00", "17:00"] },
      policy: "Spring Special includes FREE gel toes with booking. Hair must arrive clean, relaxed, and oil-free.",
      bookingMode: "appointments"
    },
    {
      id: "midrand",
      name: "Midrand Branch",
      address: "Cnr. Brand Street & Swart Dr, Workpods, Unit A12, Midrand",
      phone: "081 666 4395",
      opening: { mon: ["09:00", "17:00"], tue: ["09:00", "17:00"], wed: ["09:00", "17:00"], thu: ["09:00", "17:00"], fri: ["08:00", "17:00"], sat: ["08:00", "17:00"] },
      policy: "No hair-wash facility. Arrive with clean, relaxed, oil-free hair. Choose Fork Method / Lines or Normal Plucking when booking.",
      bookingMode: "appointments"
    },
    {
      id: "pretoria",
      name: "Pretoria Branch",
      address: "Navy House Building, Unit 614, 6th Floor, 293 Madiba Street, Pretoria",
      phone: "081 666 4395",
      opening: { mon: ["09:00", "17:00"], tue: ["09:00", "17:00"], wed: ["09:00", "17:00"], thu: ["09:00", "17:00"], fri: ["08:00", "17:00"], sat: ["08:00", "17:00"] },
      policy: "Spring Special includes FREE lashes with services. Wig installation clients must arrive with clean, neatly plaited hair. No appointments, walk-ins only.",
      bookingMode: "walk-ins"
    }
  ],
  services: [
    { id: "classic-jean", category: "Frontal Ponytails", name: "Classic Frontal Ponytail - Jean Lace 8 inch", branches: ["johannesburg", "midrand"], price: 800, specialPrice: 650, midrandPrice: 700, duration: 120, depositType: "percent", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "classic-transparent", category: "Frontal Ponytails", name: "Classic Frontal Ponytail - Transparent Lace 10 inch", branches: ["johannesburg", "midrand"], price: 1250, specialPrice: 1000, midrandPrice: 1150, duration: 120, depositType: "percent", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "classic-hd", category: "Frontal Ponytails", name: "Classic Frontal Ponytail - HD Lace", branches: ["johannesburg", "midrand"], price: 1700, specialPrice: 1500, midrandPrice: 1600, duration: 120, depositType: "percent", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "classic-lagos", category: "Frontal Ponytails", name: "Classic Frontal Ponytail - Lagos Hairline HD Lace 16 inch", branches: ["johannesburg", "midrand"], price: 1800, specialPrice: 1800, midrandPrice: 1800, duration: 270, depositType: "percent", image: "assets/Banner.jpeg", tags: ["lace", "lagos"] },
    { id: "double-jean", category: "Frontal Ponytails", name: "Double Frontal Ponytail - Jean Lace", branches: ["johannesburg", "midrand"], price: 1500, duration: 180, depositType: "full", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "double-transparent", category: "Frontal Ponytails", name: "Double Frontal Ponytail - Transparent Lace", branches: ["johannesburg", "midrand"], price: 2000, duration: 180, depositType: "full", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "double-lagos", category: "Frontal Ponytails", name: "Double Frontal Ponytail - HD Lagos Hairline", branches: ["johannesburg", "midrand"], price: 3000, duration: 270, depositType: "full", image: "assets/Banner.jpeg", tags: ["lace", "lagos"] },
    { id: "half-jean", category: "Half-Up Half-Down", name: "Half-Up Half-Down - Jean Lace", branches: ["johannesburg", "midrand"], price: 850, duration: 120, depositType: "full", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "half-transparent", category: "Half-Up Half-Down", name: "Half-Up Half-Down - Transparent Lace", branches: ["johannesburg", "midrand"], price: 1250, duration: 120, depositType: "full", image: "assets/Banner.jpeg", tags: ["lace"] },
    { id: "wig-classic", category: "Wig Installations", name: "Classic Wig Installation", branches: ["johannesburg", "midrand"], price: 300, duration: 60, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "wig-lagos", category: "Wig Installations", name: "Lagos Hairline Wig Installation", branches: ["johannesburg", "midrand"], price: 1000, duration: 270, depositType: "percent", image: "assets/Profile pic.jpeg", tags: ["lagos"] },
    { id: "sewin-labor", category: "Sew-In Installations", name: "Sew-In Labor Only", branches: ["johannesburg", "midrand"], price: 350, duration: 90, depositType: "percent", image: "assets/Banner.jpeg", tags: [] },
    { id: "cluster-lashes", category: "Eyelash Services", name: "Cluster Lashes", branches: ["johannesburg", "midrand", "pretoria"], price: 100, duration: 30, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "cat-eye", category: "Eyelash Services", name: "Cluster Lashes - Cat Eye", branches: ["johannesburg", "midrand", "pretoria"], price: 120, duration: 30, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "volume-lashes", category: "Eyelash Services", name: "Cluster Lashes - Volume", branches: ["johannesburg", "midrand", "pretoria"], price: 160, duration: 30, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "individual-classic", category: "Eyelash Services", name: "Individual Lash Extensions - Classic Set", branches: ["pretoria"], price: 350, duration: 90, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "brows-tint", category: "Brows", name: "Brow Tint & Shaping", branches: ["johannesburg"], price: 150, duration: 30, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "brows-shaping", category: "Brows", name: "Brow Shaping", branches: ["johannesburg"], price: 50, duration: 30, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "nail-soak", category: "Nail Services", name: "Nail Soak-Off Fee", branches: ["johannesburg"], price: 100, duration: 60, depositType: "percent", image: "assets/Profile pic.jpeg", tags: [] },
    { id: "masterclass", category: "Professional Masterclasses", name: "One-on-One 3-Day Hair Masterclass", branches: ["johannesburg", "midrand"], price: 3500, duration: 240, depositType: "percent", image: "assets/Banner.jpeg", tags: [] }
  ]
};
