import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import jwt from "jsonwebtoken";

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type UserRole = "admin" | "yonetici" | "genel" | "floor3" | "floor6";

const NAME_COLORS = ["#FFFFFF", "#66CCFF", "#3388FF", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FF9A8B", "#88D8B0", "#FFEAA7", "#DDA0DD"] as const;

interface User {
  id: number;
  isim: string;
  soyisim: string;
  kullaniciAdi?: string;
  password: string;
  role: UserRole;
  roles?: UserRole[];
  passwordChanged: boolean;
  profilePhoto?: string;
  nameColor?: string;
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function loadUsersFromFile(): User[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as (User & { username?: string })[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u) => {
          const roles = u.roles ?? (u.role ? [u.role] : ["genel"]);
          const validColors = new Set(NAME_COLORS);
          const nameColor = u.nameColor && validColors.has(u.nameColor as typeof NAME_COLORS[number]) ? u.nameColor : undefined;
          return {
            id: u.id,
            isim: u.isim ?? u.username ?? "",
            soyisim: u.soyisim ?? "",
            kullaniciAdi: u.kullaniciAdi ?? "",
            password: u.password,
            role: u.role ?? roles[0],
            roles,
            passwordChanged: u.passwordChanged ?? false,
            profilePhoto: u.profilePhoto ?? undefined,
            nameColor
          };
        });
      }
    }
  } catch {
    // Dosya bozuk veya yok, varsayılana dön
  }
  return [{ id: 1, isim: "admin", soyisim: "", password: "123456", role: "admin", roles: ["admin"], passwordChanged: false, kullaniciAdi: "", profilePhoto: undefined }];
}

function saveUsersToFile(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Kullanıcılar dosyaya yazılamadı:", err);
    return false;
  }
}

let users: User[] = loadUsersFromFile();
if (users.length === 1 && users[0].isim === "admin" && users[0].soyisim === "") {
  saveUsersToFile();
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "slips");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const PROFILE_PHOTOS_DIR = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(PROFILE_PHOTOS_DIR)) {
  fs.mkdirSync(PROFILE_PHOTOS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const safe = `${Number(req.params.id)}-${Date.now()}${ext}`;
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const uploadProfilePhoto = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PROFILE_PHOTOS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
}); // 5MB

app.use(cors());
app.use(express.json());

interface JwtPayload {
  userId: number;
  role: string;
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as express.Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Oturum geçersiz" });
  }
}

function adminOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { user } = req as express.Request & { user: JwtPayload };
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Yetkisiz" });
  }
  next();
}

function getCurrentUser(req: express.Request): User | undefined {
  const { user } = req as express.Request & { user: JwtPayload };
  return users.find((u) => u.id === user.userId);
}

// --- Auth ---
app.post("/auth/login", (req, res) => {
  const { isim, soyisim, password } = req.body as { isim?: string; soyisim?: string; password?: string };
  const i = (isim ?? "").trim();
  const s = (soyisim ?? "").trim();
  const user = users.find((u) => u.isim === i && u.soyisim === s && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "İsim, soyisim veya parola hatalı" });
  }
  const requiresPasswordChange = user.role === "admin" && !user.passwordChanged;
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  const roles = user.roles ?? [user.role];
  return res.json({
    token,
    user: {
      id: user.id,
      isim: user.isim,
      soyisim: user.soyisim,
      kullaniciAdi: user.kullaniciAdi ?? "",
      role: user.role,
      roles,
      requiresPasswordChange,
      profilePhoto: user.profilePhoto,
      nameColor: user.nameColor
    }
  });
});

const REGISTER_ROLES: UserRole[] = ["floor3", "floor6", "yonetici"];
app.post("/auth/register", (req, res) => {
  const { isim, soyisim, password, role, nameColor } = req.body as { isim?: string; soyisim?: string; password?: string; role?: UserRole; nameColor?: string };
  const i = (isim ?? "").trim();
  const s = (soyisim ?? "").trim();
  if (!i || !password || password.length < 4) {
    return res.status(400).json({ message: "İsim ve parola (en az 4 karakter) gerekli" });
  }
  const chosenRole: UserRole = role && REGISTER_ROLES.includes(role) ? role : "floor3";
  const validColors = new Set(NAME_COLORS);
  const color = nameColor && validColors.has(nameColor as typeof NAME_COLORS[number]) ? nameColor : undefined;
  const key = (a: string, b: string) => `${a.toLowerCase()}|${b.toLowerCase()}`;
  if (users.some((u) => key(u.isim, u.soyisim) === key(i, s))) {
    return res.status(400).json({ message: "Bu isim ve soyisim zaten kayıtlı" });
  }
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser: User = {
    id,
    isim: i,
    soyisim: s,
    kullaniciAdi: "",
    password: String(password),
    role: chosenRole,
    roles: [chosenRole],
    passwordChanged: false,
    profilePhoto: undefined,
    nameColor: color
  };
  users.push(newUser);
  saveUsersToFile();
  const token = jwt.sign(
    { userId: newUser.id, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  return res.status(201).json({
    token,
    user: { id: newUser.id, isim: newUser.isim, soyisim: newUser.soyisim, kullaniciAdi: newUser.kullaniciAdi ?? "", role: newUser.role, roles: newUser.roles ?? [chosenRole], requiresPasswordChange: false, profilePhoto: newUser.profilePhoto, nameColor: newUser.nameColor }
  });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  const u = getCurrentUser(req);
  if (!u) return res.status(401).json({ message: "Kullanıcı bulunamadı" });
  const roles = u.roles ?? [u.role];
  res.json({
    user: {
      id: u.id,
      isim: u.isim,
      soyisim: u.soyisim,
      kullaniciAdi: u.kullaniciAdi ?? "",
      role: u.role,
      roles,
      requiresPasswordChange: u.role === "admin" ? !u.passwordChanged : false,
      profilePhoto: u.profilePhoto,
      nameColor: u.nameColor
    }
  });
});

app.post("/auth/change-password", authMiddleware, (req, res) => {
  const u = getCurrentUser(req);
  if (!u) return res.status(401).send();
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (currentPassword !== u.password) {
    return res.status(400).json({ message: "Mevcut parola hatalı" });
  }
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ message: "Yeni parola en az 4 karakter olmalı" });
  }
  u.password = newPassword;
  u.passwordChanged = true;
  saveUsersToFile();
  res.json({ success: true });
});

app.post("/auth/skip-password-change", authMiddleware, (req, res) => {
  const u = getCurrentUser(req);
  if (!u || u.role !== "admin") return res.status(403).json({ message: "Yetkisiz" });
  u.passwordChanged = true;
  saveUsersToFile();
  res.json({ success: true });
});

// --- Profil güncelleme (isim, soyisim, kullaniciAdi, nameColor) ---
app.patch("/api/profile", authMiddleware, (req, res) => {
  const u = getCurrentUser(req);
  if (!u) return res.status(401).json({ message: "Kullanıcı bulunamadı" });
  const { isim, soyisim, kullaniciAdi, nameColor } = req.body as { isim?: string; soyisim?: string; kullaniciAdi?: string; nameColor?: string };
  if (isim !== undefined) u.isim = String(isim).trim();
  if (soyisim !== undefined) u.soyisim = String(soyisim).trim();
  if (kullaniciAdi !== undefined) {
    const ka = String(kullaniciAdi).trim();
    if (ka && users.some((x) => x.id !== u.id && (x.kullaniciAdi ?? "") === ka)) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }
    u.kullaniciAdi = ka;
  }
  if (nameColor !== undefined) {
    u.nameColor = new Set(NAME_COLORS).has(nameColor as typeof NAME_COLORS[number]) ? nameColor : u.nameColor;
  }
  saveUsersToFile();
  const roles = u.roles ?? [u.role];
  return res.json({
    id: u.id,
    isim: u.isim,
    soyisim: u.soyisim,
    kullaniciAdi: u.kullaniciAdi ?? "",
    role: u.role,
    roles,
    profilePhoto: u.profilePhoto,
    nameColor: u.nameColor
  });
});

// --- Profil fotoğrafı yükleme ---
app.post("/api/profile/photo", authMiddleware, uploadProfilePhoto.single("photo"), (req, res) => {
  const u = getCurrentUser(req);
  if (!u) return res.status(401).json({ message: "Kullanıcı bulunamadı" });
  if (!req.file) return res.status(400).json({ message: "Dosya yüklenmedi" });
  if (u.profilePhoto) {
    const oldPath = path.join(PROFILE_PHOTOS_DIR, u.profilePhoto);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  u.profilePhoto = req.file.filename;
  saveUsersToFile();
  return res.json({ profilePhoto: u.profilePhoto });
});

// --- Profil fotoğrafı servisi (token ile) ---
app.get("/api/profile/photo/:filename", slipAuth, (req, res) => {
  const filename = req.params.filename;
  if (!/^[a-zA-Z0-9\-\._]+$/.test(filename)) return res.status(400).send();
  const filePath = path.join(PROFILE_PHOTOS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send();
  res.sendFile(filePath);
});

// --- Kullanıcı sayısı (giriş yapmış herkes görebilir) ---
app.get("/api/users/count", authMiddleware, (_req, res) => {
  const count = users.filter((u) => u.role !== "admin").length;
  res.json({ count });
});

// --- Kullanıcı listesi ve rol güncelleme (sadece admin) ---
app.get("/api/users", authMiddleware, adminOnly, (_req, res) => {
  const list = users.map((u) => ({
    id: u.id,
    isim: u.isim,
    soyisim: u.soyisim,
    kullaniciAdi: u.kullaniciAdi ?? "",
    role: u.role,
    roles: u.roles ?? [u.role],
    nameColor: u.nameColor
  }));
  res.json(list);
});

app.post("/api/users", authMiddleware, adminOnly, (req, res) => {
  const { isim, soyisim, password, role } = req.body as { isim?: string; soyisim?: string; password?: string; role?: UserRole };
  const i = (isim ?? "").trim();
  const s = (soyisim ?? "").trim();
  if (!i || !password || String(password).length < 4) {
    return res.status(400).json({ message: "İsim ve parola (en az 4 karakter) gerekli" });
  }
  const chosenRole: UserRole = role && REGISTER_ROLES.includes(role) ? role : "floor3";
  const key = (a: string, b: string) => `${a.toLowerCase()}|${b.toLowerCase()}`;
  if (users.some((u) => key(u.isim, u.soyisim) === key(i, s))) {
    return res.status(400).json({ message: "Bu isim ve soyisim zaten kayıtlı" });
  }
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser: User = {
    id,
    isim: i,
    soyisim: s,
    kullaniciAdi: "",
    password: String(password),
    role: chosenRole,
    roles: [chosenRole],
    passwordChanged: false,
    profilePhoto: undefined
  };
  users.push(newUser);
  saveUsersToFile();
  return res.status(201).json({ id: newUser.id, isim: newUser.isim, soyisim: newUser.soyisim, role: newUser.role, roles: newUser.roles });
});

app.delete("/api/users/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Geçersiz kullanıcı id" });
  const target = users.find((u) => u.id === id);
  if (!target) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  if (target.role === "admin") return res.status(400).json({ message: "Admin silinemez" });
  users = users.filter((u) => u.id !== target.id);
  if (!saveUsersToFile()) return res.status(500).json({ message: "Kullanıcı silindi ama kayıt güncellenemedi" });
  return res.status(204).send();
});

app.post("/api/users/:id/set-password", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const { newPassword } = req.body as { newPassword?: string };
  const target = users.find((u) => u.id === id);
  if (!target) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ message: "Yeni parola en az 4 karakter olmalı" });
  }
  target.password = String(newPassword);
  target.passwordChanged = true;
  saveUsersToFile();
  return res.json({ success: true });
});

app.patch("/api/users/:id", authMiddleware, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const { roles: newRoles, isim: newIsim, soyisim: newSoyisim, kullaniciAdi: newKullaniciAdi } = req.body as {
    roles?: UserRole[];
    isim?: string;
    soyisim?: string;
    kullaniciAdi?: string;
  };
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

  if (newIsim !== undefined) user.isim = String(newIsim).trim();
  if (newSoyisim !== undefined) user.soyisim = String(newSoyisim).trim();
  if (newKullaniciAdi !== undefined) {
    const ka = String(newKullaniciAdi).trim();
    if (ka && users.some((u) => u.id !== id && (u.kullaniciAdi ?? "") === ka)) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }
    user.kullaniciAdi = ka;
  }

  if (user.role !== "admin" && Array.isArray(newRoles) && newRoles.length > 0) {
    const valid: UserRole[] = [];
    for (const r of newRoles) {
      if ((r === "genel" || r === "floor3" || r === "floor6" || r === "yonetici") && !valid.includes(r)) valid.push(r);
    }
    if (valid.includes("yonetici") && valid.length > 1) {
      user.roles = ["yonetici"];
      user.role = "yonetici";
    } else {
      user.roles = valid.length ? valid : ["genel"];
      user.role = user.roles[0];
    }
  }

  if (newIsim !== undefined || newSoyisim !== undefined || newKullaniciAdi !== undefined || (Array.isArray(newRoles) && newRoles.length > 0 && user.role !== "admin")) {
    saveUsersToFile();
  }
  return res.json({ id: user.id, isim: user.isim, soyisim: user.soyisim, kullaniciAdi: user.kullaniciAdi ?? "", role: user.role, roles: user.roles ?? [user.role] });
});

// Slip dosyaları
function slipAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const tokenFromHeader = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const tokenFromQuery = (req.query.token as string) || null;
  const token = tokenFromHeader || tokenFromQuery;
  if (!token) {
    return res.status(401).json({ message: "Giriş gerekli" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as express.Request & { user: JwtPayload }).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Oturum geçersiz" });
  }
}

app.get("/api/slips/:filename", slipAuth, (req, res) => {
  const filename = req.params.filename;
  if (!/^[\d\-\.a-zA-Z]+$/.test(filename)) {
    return res.status(400).send();
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send();
  }
  res.sendFile(filePath);
});

// --- Items (rol: admin tüm lokasyonlar, diğerleri sadece kendi rol lokasyonu) ---
type Category = "market" | "ofis" | "kuruyemiş" | "meyve" | "other";
type Status = "NORMAL" | "LOW" | "MISSING" | "BOUGHT";
type Location = "genel" | "floor3" | "floor6";

interface Item {
  id: number;
  name: string;
  category: Category;
  status: Status;
  requiredQuantity: number;
  location: Location;
  createdAt: string;
  boughtAt?: string;
  slipFileName?: string;
  createdByUserId?: number;
}

/** Malzeme adına göre otomatik kategori tahmini (Market, Ofis, Kuruyemiş, Meyve) - güçlendirilmiş */
function autoCategory(name: string): Category {
  const n = (name || "").toLowerCase().trim();
  const ofisKeys = ["kağıt", "kagit", "a4", "a3", "kalem", "tükenmez", "tukenmez", "defter", "dosya", "zımba", "zimba", "makas", "bant", "toner", "kartuş", "kartus", "klasör", "klasor", "silgi", "tahta", "tebeşir", "tebesir", "flip", "projeksiyon", "yazıcı", "yazici", "fotokopi", "tarayıcı", "tarayici", "mouse", "klavye", "usb", "kablo", "etiket", "zarflar", "zarf", "cd", "dvd", "sunum", "perforator", "delgeç", "delgec", "ataç", "atac", "şeffaf", "seffaf", "dosyalama", "arşiv", "arsiv", "çıktı", "cikti", "toner", "mürekkep", "murekkep", "tel", "zımba teli", "perforaj", "laminasyon", "ofis", "masa", "sandalye", "monitör", "monitor", "laptop", "adaptör", "adaptor", "priz", "uzatma", "organizer", "kalemlik", "not", "bloknot", "yapışkan", "yapiskan", "postit", "post-it"];
  const kuruyemisKeys = ["fındık", "findik", "fıstık", "fistik", "ceviz", "badem", "leblebi", "çekirdek", "cekirdek", "kuru üzüm", "kuru uzum", "kuru kayısı", "kayisi", "kuruyemiş", "kuruyemis", "antep", "fıstık", "kaju", "yer fıstığı", "yer fistigi", "ay çekirdeği", "ay cekirdegi", "kabak çekirdeği", "badem", "kuru incir", "kuru dut", "erik kurusu", "hurma", "kuru domates", "sarı leblebi", "sari leblebi", "nohut", "patlamış mısır", "patlamis misir", "mısır", "misir"];
  const meyveKeys = ["elma", "armut", "portakal", "mandalina", "muz", "çilek", "cilek", "üzüm", "uzum", "karpuz", "kavun", "kiraz", "şeftali", "seftali", "erik", "kivi", "mango", "avokado", "meyve", "limon", "greyfurt", "nar", "ayva", "incir", "dut", "kayısı", "kaysi", "ananas", "çarkıfelek", "carkifelek", "passion", "dragon", "papaya", "guava", "böğürtlen", "bogurtlen", "ahududu", "yaban mersini", "frambuaz", "mürdüm", "murdum", "taze", "taze meyve", "meyve tabağı", "meyve tabagi"];
  const marketKeys = ["kahve", "çay", "cay", "süt", "sut", "su", "meşrubat", "mesrubat", "içecek", "icecek", "bisküvi", "bisküvi", "çikolata", "cikolata", "şeker", "seker", "sakız", "sakiz", "deterjan", "tuvalet", "havlu", "sabun", "şampuan", "sampuan", "peçete", "pecete", "yoğurt", "yogurt", "peynir", "zeytin", "reçel", "recel", "bal", "ekmek", "simit", "poğaça", "pogaca", "börek", "borek", "salça", "salca", "yağ", "yag", "tuz", "un", "pirinç", "pirinc", "makarna", "konserve", "domates", "salatalık", "biber", "soğan", "sogan", "patates", "yumurta", "gazoz", "kola", "ayran", "maden suyu", "meyve suyu", "soda", "limonata", "sütlü", "sutlu", "bitki çayı", "bitki cayi", "yeşil çay", "yesil cay", "granola", "mısır gevreği", "misir gevreği", "kraker", "cips", "yoğurt", "süzme", "suzme", "tereyağ", "tereyag", "ketçap", "ketcap", "hardal", "mayonez", "baharat", "tane karabiber", "pul biber", "nane", "fesleğen", "feslegen", "çorba", "corba", "bulyon", "hazır", "hazir", "dondurma", "dondurulmuş", "dondurulmus", "atıştırmalık", "atistirmalik", "kek", "kurabiye", "pasta", "tatlı", "tatli", "sütlü tatlı", "sutlu tatli"];

  for (const k of ofisKeys) if (n.includes(k)) return "ofis";
  for (const k of kuruyemisKeys) if (n.includes(k)) return "kuruyemiş";
  for (const k of meyveKeys) if (n.includes(k)) return "meyve";
  for (const k of marketKeys) if (n.includes(k)) return "market";
  return "other";
}

function creatorLocationRole(u: User): "genel" | "floor3" | "floor6" {
  const roles = u.roles ?? [u.role];
  if (roles.includes("floor3")) return "floor3";
  if (roles.includes("floor6")) return "floor6";
  return "genel";
}

function enrichItemWithCreator(item: Item): Item & { createdBy?: { id: number; isim: string; soyisim: string; profilePhoto?: string; nameColor?: string; roleLabel: string } | null } {
  const creator = item.createdByUserId ? users.find((u) => u.id === item.createdByUserId) : undefined;
  const locRole = creator ? creatorLocationRole(creator) : "genel";
  const roleLabel = locRole === "floor3" ? "3. kat" : locRole === "floor6" ? "6. kat" : "Genel";
  return {
    ...item,
    createdBy: creator
      ? { id: creator.id, isim: creator.isim, soyisim: creator.soyisim, profilePhoto: creator.profilePhoto ?? undefined, nameColor: creator.nameColor, roleLabel }
      : null
  };
}

let items: Item[] = [
  { id: 1, name: "KAHVE", category: "market", status: "MISSING", requiredQuantity: 1, location: "genel", createdAt: new Date().toISOString() },
  { id: 2, name: "A4 KAĞIT", category: "ofis", status: "NORMAL", requiredQuantity: 1, location: "genel", createdAt: new Date().toISOString() }
];

/** Kullanıcının görebileceği lokasyonlar: "all" = hepsi, yoksa [genel, floor3, floor6] alt kümesi */
function userVisibleLocations(req: express.Request): Location[] | "all" {
  const u = getCurrentUser(req);
  if (!u) return ["genel"];
  if (u.role === "admin" || u.role === "yonetici") return "all";
  const roles = u.roles ?? [u.role];
  const locs: Location[] = [];
  if (roles.includes("genel")) locs.push("genel");
  if (roles.includes("floor3")) locs.push("floor3");
  if (roles.includes("floor6")) locs.push("floor6");
  return locs.length ? locs : ["genel"];
}

app.get("/api/items", authMiddleware, (_req, res) => {
  res.json(items.map(enrichItemWithCreator));
});

app.post("/api/items", authMiddleware, (req, res) => {
  const visible = userVisibleLocations(req);
  const { name, requiredQuantity, location } = req.body as {
    name: string;
    requiredQuantity?: number;
    location?: Location;
  };
  let allowedLoc: Location = "genel";
  if (visible === "all") {
    allowedLoc = (location === "floor3" || location === "floor6" || location === "genel") ? location : "genel";
  } else {
    const locs = visible as Location[];
    allowedLoc = (location && locs.includes(location) ? location : locs[0]) as Location;
  }
  const itemName = (name || "").toUpperCase();
  const { user } = req as express.Request & { user: JwtPayload };
  const newItem: Item = {
    id: items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1,
    name: itemName,
    category: autoCategory(itemName),
    status: "MISSING",
    requiredQuantity: requiredQuantity && requiredQuantity > 0 ? requiredQuantity : 1,
    location: allowedLoc,
    createdAt: new Date().toISOString(),
    createdByUserId: user.userId
  };
  items.push(newItem);
  res.status(201).json(enrichItemWithCreator(newItem));
});

function canAccessItem(req: express.Request, item: Item): boolean {
  const visible = userVisibleLocations(req);
  if (visible === "all") return true;
  return (visible as Location[]).includes(item.location);
}

app.patch("/api/items/:id/status", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  if (!canAccessItem(req, item)) return res.status(403).json({ message: "Yetkisiz" });
  const { status } = req.body as { status: Status };
  item.status = status;
  if (status === "BOUGHT") {
    item.boughtAt = new Date().toISOString();
  } else {
    item.boughtAt = undefined;
    item.slipFileName = undefined;
  }
  res.json(enrichItemWithCreator(item));
});

app.post("/api/items/:id/slip", authMiddleware, upload.single("slip"), (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  if (!canAccessItem(req, item)) return res.status(403).json({ message: "Yetkisiz" });
  if (!req.file) return res.status(400).json({ message: "Dosya yüklenmedi" });
  item.slipFileName = req.file.filename;
  res.json(enrichItemWithCreator(item));
});

app.delete("/api/items/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  items = items.filter((i) => i.id !== id);
  res.status(204).send();
});

app.delete("/api/items", authMiddleware, (req, res) => {
  const { user } = req as express.Request & { user: JwtPayload };
  if (user.role !== "admin") return res.status(403).json({ message: "Sadece admin öğe silebilir" });
  const location = req.query.location as Location | undefined;
  if (location === "genel" || location === "floor3" || location === "floor6") {
    items = items.filter((i) => i.location !== location);
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
