import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { OrbisisLogo } from "./OrbisisLogo";

type Category = "market" | "ofis" | "kuruyemiş" | "meyve" | "other";
type Status = "NORMAL" | "LOW" | "MISSING" | "BOUGHT";
type Location = "genel" | "floor3" | "floor6";

interface ItemCreator {
  id: number;
  isim: string;
  soyisim: string;
  profilePhoto?: string;
  nameColor?: string;
  roleLabel?: string;
}
interface Item {
  id: number;
  name: string;
  category: Category;
  status: Status;
  requiredQuantity: number;
  location: Location;
  createdAt?: string;
  boughtAt?: string;
  slipFileName?: string;
  createdBy?: ItemCreator | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || "";
const NAME_COLORS = ["#FFFFFF", "#66CCFF", "#3388FF", "#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA", "#FCBAD3", "#A8D8EA", "#FF9A8B", "#88D8B0", "#FFEAA7", "#DDA0DD"];

type UserRole = "admin" | "yonetici" | "genel" | "floor3" | "floor6";

interface ApiUser {
  id: number;
  isim: string;
  soyisim: string;
  role: UserRole;
  roles?: UserRole[];
  nameColor?: string;
}

const LOCATION_ROLES: { value: UserRole; label: string }[] = [
  { value: "genel", label: "Genel" },
  { value: "floor3", label: "3. kat" },
  { value: "floor6", label: "6. kat" },
  { value: "yonetici", label: "Yönetici" }
];

const AdminRoleSection: React.FC<{ getAuthHeaders: () => Record<string, string> }> = ({ getAuthHeaders }) => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = (await res.json()) as ApiUser[];
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleRole = (currentRoles: UserRole[], role: UserRole): UserRole[] => {
    if (role === "yonetici") return currentRoles.includes("yonetici") ? [] : ["yonetici"];
    const next = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
    return next.filter((r) => r !== "yonetici");
  };

  const updateRoles = async (userId: number, newRoles: UserRole[]) => {
    if (newRoles.length === 0) newRoles = ["genel"];
    setUpdatingId(userId);
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ roles: newRoles })
      });
      if (res.ok) await loadUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="card admin-roles-card">
      <h2>Rol yönetimi</h2>
      <p className="admin-roles-desc">Birden fazla rol atayabilirsiniz (örn. 3. kat + 6. kat).</p>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <ul className="admin-user-list">
          {users.map((u) => {
            const roles = u.roles ?? [u.role];
            return (
              <li key={u.id} className="admin-user-row">
                <span className="admin-user-name">{u.isim}{u.soyisim ? ` ${u.soyisim}` : ""}</span>
                {u.role === "admin" ? (
                  <span className="admin-user-role-badge">Admin</span>
                ) : (
                  <div className="admin-roles-multi">
                    {LOCATION_ROLES.map(({ value, label }) => (
                      <label key={value} className="admin-role-check">
                        <input
                          type="checkbox"
                          checked={roles.includes(value)}
                          disabled={updatingId === u.id}
                          onChange={() => updateRoles(u.id, toggleRole(roles, value))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export const App: React.FC = () => {
  const { token, user, login, register, logout, setUser, getAuthHeaders, slipUrl, profilePhotoUrl } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState<string>("1");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"needed" | "bought">("needed");
  const [slipModalItemId, setSlipModalItemId] = useState<number | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);
  const [previewSlip, setPreviewSlip] = useState<{ url: string; fileName: string; itemName: string } | null>(null);
  const [previewDownloadName, setPreviewDownloadName] = useState("");
  const [view, setView] = useState<"main" | "admin">("main");
  const [mainView, setMainView] = useState<"home" | "list">("home");
  const [userCount, setUserCount] = useState<number>(0);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const touchPressedRef = useRef<HTMLElement | null>(null);

  const [loginIsim, setLoginIsim] = useState("");
  const [loginSoyisim, setLoginSoyisim] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regIsim, setRegIsim] = useState("");
  const [regSoyisim, setRegSoyisim] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [firstLoginCurrent, setFirstLoginCurrent] = useState("");
  const [firstLoginNew, setFirstLoginNew] = useState("");
  const [firstLoginLoading, setFirstLoginLoading] = useState(false);

  const [adminCurrentPw, setAdminCurrentPw] = useState("");
  const [adminNewPw, setAdminNewPw] = useState("");
  const [adminPwError, setAdminPwError] = useState("");
  const [adminPwLoading, setAdminPwLoading] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileIsim, setProfileIsim] = useState("");
  const [profileSoyisim, setProfileSoyisim] = useState("");
  const [profileKullaniciAdi, setProfileKullaniciAdi] = useState("");
  const [profileCurrentPw, setProfileCurrentPw] = useState("");
  const [profileNewPw, setProfileNewPw] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);
  const [profileNameColor, setProfileNameColor] = useState<string>("");
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/items`, { headers: getAuthHeaders() });
      if (res.status === 401) {
        logout();
        return;
      }
      const data = (await res.json()) as Item[];
      setItems(data);
    } catch (e) {
      setError("Liste yüklenirken hata oluştu.");
    }
  };

  const loadUserCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/count`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setUserCount(data.count);
      }
    } catch {
      /* ignore */
    }
  };

  const needCount = items.filter(i => i.status !== "BOUGHT").length;
  const boughtCount = items.filter(i => i.status === "BOUGHT").length;
  const visibleItems = items
    .filter(item => (activeTab === "needed" ? item.status !== "BOUGHT" : item.status === "BOUGHT"))
    .sort((a, b) => b.id - a.id);
  const visibleIds = visibleItems.map(i => i.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedItemIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedItemIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelectedItems = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`${selectedItemIds.length} öğeyi silmek istediğinize emin misiniz?`)) return;
    setError(null);
    for (const id of selectedItemIds) {
      try {
        await fetch(`${API_BASE}/api/items/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      } catch {
        setError("Seçilenler silinirken hata oluştu.");
      }
    }
    setSelectedItemIds([]);
    void loadItems();
  };

  useEffect(() => {
    if (token && user) {
      void loadItems();
      void loadUserCount();
    }
  }, [token, user]);

  useEffect(() => {
    const selector = "button, .stat-box-clickable, .add-item-bottom, .bottom-nav-item, .tab, .header-btn";
    const clearPressed = (el: HTMLElement | null) => {
      if (el?.classList.contains("touch-pressed")) el.classList.remove("touch-pressed");
      touchPressedRef.current = null;
    };
    const onTouchStart = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest?.(selector) as HTMLElement | null;
      if (target && !target.hasAttribute("disabled")) {
        touchPressedRef.current = target;
        target.classList.add("touch-pressed");
      }
    };
    const onTouchEnd = () => {
      clearPressed(touchPressedRef.current);
    };
    const onTouchCancel = () => {
      clearPressed(touchPressedRef.current);
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
      clearPressed(touchPressedRef.current);
    };
  }, []);
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => { void loadItems(); void loadUserCount(); }, 2000);
    return () => clearInterval(interval);
  }, [token, user]);

  const addItem = async () => {
    if (!newItemName.trim()) return;
    const qty = Math.max(1, parseInt(newItemQuantity, 10) || 1);
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName, requiredQuantity: qty, location: "genel" })
      });
      const created = (await res.json()) as Item;
      setItems(prev => [...prev, created]);
      setNewItemName("");
      setNewItemQuantity("1");
    } catch {
      setError("Malzeme eklenirken hata oluştu.");
    }
  };

  const updateStatus = async (itemId: number, status: Status) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/api/items/${itemId}/status`, {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Status update failed");
      const updated = (await res.json()) as Item;
      setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
    } catch {
      setError("Durum güncellenirken hata oluştu.");
    }
  };

  const uploadSlip = async (itemId: number, file: File) => {
    const form = new FormData();
    form.append("slip", file);
    const res = await fetch(`${API_BASE}/api/items/${itemId}/slip`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form
    });
    if (!res.ok) throw new Error("Slip upload failed");
    return (await res.json()) as Item;
  };

  const openSlipModal = (itemId: number) => {
    setSlipModalItemId(itemId);
    setSlipFile(null);
    slipInputRef.current?.value && (slipInputRef.current.value = "");
  };

  const closeSlipModal = () => {
    setSlipModalItemId(null);
    setSlipFile(null);
  };

  const openPreviewSlip = (fileName: string, itemName: string) => {
    setPreviewSlip({
      url: slipUrl(fileName),
      fileName,
      itemName
    });
    setPreviewDownloadName(fileName);
  };

  const closePreviewSlip = () => {
    setPreviewSlip(null);
    setPreviewDownloadName("");
  };

  const isPdf = (name: string) => /\.pdf$/i.test(name);

  const confirmMarkBoughtAndSlip = async () => {
    if (slipModalItemId == null) return;
    setSlipUploading(true);
    setError(null);
    try {
      if (slipFile) {
        const updated = await uploadSlip(slipModalItemId, slipFile);
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      }
      await updateStatus(slipModalItemId, "BOUGHT");
      closeSlipModal();
    } catch {
      setError("Fatura yüklenirken veya kaydedilirken hata oluştu.");
    } finally {
      setSlipUploading(false);
    }
  };

  const handleSlipUploadInBought = async (itemId: number, file: File) => {
    setError(null);
    try {
      const updated = await uploadSlip(itemId, file);
      setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
    } catch {
      setError("Fatura yüklenirken hata oluştu.");
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!window.confirm("Bu öğeyi silmek istediğinize emin misiniz?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      setError("Silinirken hata oluştu.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await login(loginIsim.trim(), loginSoyisim.trim(), loginPassword);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.message || "Giriş başarısız");
  };

  const handleFirstLoginSkip = async () => {
    setFirstLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/skip-password-change`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
      });
      if (res.ok) setUser({ ...user!, requiresPasswordChange: false });
    } finally {
      setFirstLoginLoading(false);
    }
  };

  const handleFirstLoginSave = async () => {
    if (!firstLoginNew || firstLoginNew.length < 4) return;
    setFirstLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: firstLoginCurrent, newPassword: firstLoginNew })
      });
      if (res.ok) {
        setUser({ ...user!, requiresPasswordChange: false });
        setFirstLoginCurrent("");
        setFirstLoginNew("");
      }
    } finally {
      setFirstLoginLoading(false);
    }
  };

  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPwError("");
    setAdminPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: adminCurrentPw, newPassword: adminNewPw })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminCurrentPw("");
        setAdminNewPw("");
        setView("main");
      } else {
        setAdminPwError(data.message || "İşlem başarısız");
      }
    } finally {
      setAdminPwLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    const result = await register(regIsim.trim(), regSoyisim.trim(), regPassword);
    setRegLoading(false);
    if (!result.success) setRegError(result.message || "Kayıt başarısız");
  };

  if (!token) {
    return (
      <div className="app login-screen">
        <div className="login-card">
          <OrbisisLogo height={84} showTagline className="brand-logo login-logo" />
          <h1 className="logo">ORBİSİS İHTİYAÇ</h1>
          <p className="subtitle">{showRegister ? "Kayıt olun" : "Giriş yapın"}</p>
          {!showRegister ? (
            <form onSubmit={handleLogin} className="login-form">
              {loginError && <div className="error">{loginError}</div>}
              <input
                type="text"
                placeholder="İsim (admin için: admin)"
                value={loginIsim}
                onChange={(e) => setLoginIsim(e.target.value)}
                autoComplete="given-name"
                className="login-input"
              />
              <input
                type="text"
                placeholder="Soyisim (admin için boş bırakın)"
                value={loginSoyisim}
                onChange={(e) => setLoginSoyisim(e.target.value)}
                autoComplete="family-name"
                className="login-input"
              />
              <input
                type="password"
                placeholder="Parola (admin: 123456)"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                className="login-input"
              />
              <button type="submit" disabled={loginLoading} className="login-btn">
                {loginLoading ? "Giriş yapılıyor..." : "Giriş yap"}
              </button>
              <button type="button" className="login-link" onClick={() => { setShowRegister(true); setLoginError(""); }}>
                Hesabım yok, kayıt ol
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              {regError && <div className="error">{regError}</div>}
              <input
                type="text"
                placeholder="İsim"
                value={regIsim}
                onChange={(e) => setRegIsim(e.target.value)}
                autoComplete="given-name"
                className="login-input"
                required
              />
              <input
                type="text"
                placeholder="Soyisim"
                value={regSoyisim}
                onChange={(e) => setRegSoyisim(e.target.value)}
                autoComplete="family-name"
                className="login-input"
              />
              <input
                type="password"
                placeholder="Parola (en az 4 karakter)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                autoComplete="new-password"
                className="login-input"
                minLength={4}
                required
              />
              <button type="submit" disabled={regLoading} className="login-btn">
                {regLoading ? "Kaydediliyor..." : "Kayıt ol"}
              </button>
              <button type="button" className="login-link" onClick={() => { setShowRegister(false); setRegError(""); }}>
                Zaten hesabım var, giriş yap
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (view === "admin") {
    return (
      <div className="app app-with-safe-top">
        <header className="app-header admin-header safe-top">
          <button type="button" className="back-btn" onClick={() => setView("main")}>
            ← Geri
          </button>
          <h1 className="logo">Admin paneli</h1>
        </header>
        <main className="main admin-panel">
          <section className="card">
            <h2>Şifre değiştir</h2>
            <form onSubmit={handleAdminChangePassword} className="admin-form">
              {adminPwError && <div className="error">{adminPwError}</div>}
              <input
                type="password"
                placeholder="Mevcut parola"
                value={adminCurrentPw}
                onChange={(e) => setAdminCurrentPw(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="password"
                placeholder="Yeni parola (en az 4 karakter)"
                value={adminNewPw}
                onChange={(e) => setAdminNewPw(e.target.value)}
                className="login-input"
                minLength={4}
                required
              />
              <button type="submit" disabled={adminPwLoading}>
                {adminPwLoading ? "Kaydediliyor..." : "Parolayı güncelle"}
              </button>
            </form>
          </section>
          <AdminRoleSection getAuthHeaders={getAuthHeaders} />
        </main>
      </div>
    );
  }

  return (
    <div className="app app-with-safe-top">
      {user?.requiresPasswordChange && (
        <div className="modal-overlay">
          <div className="modal first-login-modal">
            <h3>İlk giriş — İsteğe bağlı şifre belirleme</h3>
            <p className="modal-hint">Varsayılan parolayı değiştirmek isterseniz aşağıdan yeni parola belirleyebilirsiniz.</p>
            <input
              type="password"
              placeholder="Mevcut parola"
              value={firstLoginCurrent}
              onChange={(e) => setFirstLoginCurrent(e.target.value)}
              className="login-input"
            />
            <input
              type="password"
              placeholder="Yeni parola (en az 4 karakter)"
              value={firstLoginNew}
              onChange={(e) => setFirstLoginNew(e.target.value)}
              className="login-input"
              minLength={4}
            />
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={handleFirstLoginSkip} disabled={firstLoginLoading}>
                Atla
              </button>
              <button type="button" onClick={handleFirstLoginSave} disabled={firstLoginLoading || firstLoginNew.length < 4}>
                {firstLoginLoading ? "Kaydediliyor..." : "Yeni parolayı kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mobile-header safe-top">
        <div className="mobile-brand">
          <div className="mobile-logo-wrap">
            <OrbisisLogo height={48} showTagline className="mobile-logo-img" />
            <h1 className="app-title">Orbisis İhtiyaç</h1>
          </div>
        </div>
        <div className="header-user-wrap">
          <button type="button" className="header-logout-btn" onClick={logout}>
            Çıkış
          </button>
          <button
            type="button"
            className="header-user-btn profile-avatar-btn"
            onClick={() => {
              setProfileIsim(user?.isim ?? "");
              setProfileSoyisim(user?.soyisim ?? "");
              setProfileKullaniciAdi(user?.kullaniciAdi ?? "");
              setProfileNameColor(user?.nameColor ?? "");
              setProfileCurrentPw("");
              setProfileNewPw("");
              setProfileError("");
              setShowProfileModal(true);
            }}
            aria-label="Profil"
          >
            {user?.profilePhoto && profilePhotoUrl(user.profilePhoto) ? (
              <img src={profilePhotoUrl(user.profilePhoto)} alt="" className="profile-avatar-img" />
            ) : (
              <svg className="header-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal profile-modal" onClick={e => e.stopPropagation()}>
            <h3>Profil</h3>
            <div className="profile-photo-row">
              <div className="profile-photo-preview">
                {user?.profilePhoto && profilePhotoUrl(user.profilePhoto) ? (
                  <img src={profilePhotoUrl(user.profilePhoto)} alt="" />
                ) : (
                  <span className="profile-photo-placeholder">Fotoğraf yok</span>
                )}
              </div>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                className="slip-input-hidden"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f || !token) return;
                  setProfilePhotoLoading(true);
                  setProfileError("");
                  try {
                    const form = new FormData();
                    form.append("photo", f);
                    const res = await fetch(`${API_BASE}/api/profile/photo`, {
                      method: "POST",
                      headers: getAuthHeaders(),
                      body: form
                    });
                    const data = await res.json();
                    if (res.ok && data.profilePhoto && user) {
                      setUser({ ...user, profilePhoto: data.profilePhoto });
                    } else {
                      setProfileError("Fotoğraf yüklenemedi");
                    }
                  } catch {
                    setProfileError("Fotoğraf yüklenemedi");
                  }
                  setProfilePhotoLoading(false);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={profilePhotoLoading}
              >
                {profilePhotoLoading ? "Yükleniyor..." : "Profil fotoğrafı ekle"}
              </button>
            </div>
            <label className="profile-label">İsim</label>
            <input
              type="text"
              value={profileIsim}
              onChange={e => setProfileIsim(e.target.value)}
              className="login-input"
              placeholder="İsim"
            />
            <label className="profile-label">Soyisim</label>
            <input
              type="text"
              value={profileSoyisim}
              onChange={e => setProfileSoyisim(e.target.value)}
              className="login-input"
              placeholder="Soyisim"
            />
            <label className="profile-label">Kullanıcı adı</label>
            <input
              type="text"
              value={profileKullaniciAdi}
              onChange={e => setProfileKullaniciAdi(e.target.value)}
              className="login-input"
              placeholder="Kullanıcı adı (isteğe bağlı)"
            />
            <label className="profile-label">İsim rengi</label>
            <div className="profile-color-row">
              {NAME_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`profile-color-swatch ${profileNameColor === c ? "profile-color-swatch-active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setProfileNameColor(c)}
                  title={c}
                />
              ))}
            </div>
            <button
              type="button"
              className="primary profile-save-btn"
              disabled={profileLoading}
              onClick={async () => {
                setProfileError("");
                setProfileLoading(true);
                try {
                  const res = await fetch(`${API_BASE}/api/profile`, {
                    method: "PATCH",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ isim: profileIsim.trim(), soyisim: profileSoyisim.trim(), kullaniciAdi: profileKullaniciAdi.trim(), nameColor: profileNameColor || undefined })
                  });
                  const data = await res.json();
                  if (res.ok && user) {
                    setUser({ ...user, isim: data.isim, soyisim: data.soyisim, kullaniciAdi: data.kullaniciAdi, nameColor: data.nameColor ?? null });
                  } else {
                    setProfileError(data.message || "Kaydedilemedi");
                  }
                } catch {
                  setProfileError("Bağlantı hatası");
                }
                setProfileLoading(false);
              }}
            >
              {profileLoading ? "Kaydediliyor..." : "Bilgileri kaydet"}
            </button>
            <hr className="profile-hr" />
            <label className="profile-label">Şifre değiştir</label>
            <input
              type="password"
              value={profileCurrentPw}
              onChange={e => setProfileCurrentPw(e.target.value)}
              className="login-input"
              placeholder="Mevcut parola"
            />
            <input
              type="password"
              value={profileNewPw}
              onChange={e => setProfileNewPw(e.target.value)}
              className="login-input"
              placeholder="Yeni parola (en az 4 karakter)"
            />
            <button
              type="button"
              className="secondary"
              disabled={profileLoading || !profileCurrentPw || profileNewPw.length < 4}
              onClick={async () => {
                setProfileError("");
                setProfileLoading(true);
                try {
                  const res = await fetch(`${API_BASE}/auth/change-password`, {
                    method: "POST",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ currentPassword: profileCurrentPw, newPassword: profileNewPw })
                  });
                  if (res.ok) {
                    setProfileCurrentPw("");
                    setProfileNewPw("");
                  } else {
                    const data = await res.json();
                    setProfileError(data.message || "Parola güncellenemedi");
                  }
                } catch {
                  setProfileError("Bağlantı hatası");
                }
                setProfileLoading(false);
              }}
            >
              Parolayı güncelle
            </button>
            {profileError && <div className="error">{profileError}</div>}
            {user?.role === "admin" && (
              <>
                <hr className="profile-hr" />
                <button
                  type="button"
                  className="primary"
                  onClick={() => { setView("admin"); setShowProfileModal(false); }}
                >
                  Rol kontrol paneli
                </button>
              </>
            )}
            <div className="profile-modal-actions">
              <button type="button" className="secondary" onClick={() => setShowProfileModal(false)}>
                Kapat
              </button>
              <button type="button" className="header-btn-logout" onClick={() => { logout(); setShowProfileModal(false); }}>
                Çıkış
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main">
        {mainView === "home" ? (
          <section key="home" className="card home-stats-card main-view-enter">
            <h2 className="section-title">Ana Sayfa</h2>
            <div className="stats-row">
              <div className="stat-box stat-box-clickable" role="button" tabIndex={0} onClick={() => { setMainView("list"); setActiveTab("needed"); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMainView("list"); setActiveTab("needed"); } }}>
                <span className="stat-value stat-value-orange">{needCount}</span>
                <span className="stat-label">İhtiyaç var</span>
              </div>
              <div className="stat-box stat-box-clickable" role="button" tabIndex={0} onClick={() => { setMainView("list"); setActiveTab("bought"); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMainView("list"); setActiveTab("bought"); } }}>
                <span className="stat-value stat-value-green">{boughtCount}</span>
                <span className="stat-label">Alındı</span>
              </div>
            </div>
            <div className="stats-row stats-row-single">
              <div className="stat-box stat-box-user">
                <span className="stat-value stat-value-primary">{userCount}</span>
                <span className="stat-label">Kullanıcı</span>
              </div>
            </div>
            <p className="stats-hint">Genel özet · İhtiyaç var veya Alındı’ya dokunun, ilgili liste açılır</p>
          </section>
        ) : (
        <section key="list" className="card list-card main-view-enter">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "needed" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("needed")}
            >
              İhtiyaçlar
            </button>
            <button
              className={`tab ${activeTab === "bought" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("bought")}
            >
              Alınanlar
            </button>
          </div>

          <h2 className="section-title">
            {activeTab === "needed" ? "Eksik Ürünler" : "Alınanlar"}
          </h2>

          {error && <div className="error">{error}</div>}

          {visibleItems.length > 0 && (
            <div className="list-actions-row">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="list-checkbox"
                />
                <span className="select-all-text">Tümünü seç</span>
              </label>
              {selectedItemIds.length > 0 && (
                <button type="button" className="clear-selected-btn" onClick={clearSelectedItems}>
                  Seçilenleri sil ({selectedItemIds.length})
                </button>
              )}
            </div>
          )}

          <div className="list-card">
            <ul className="item-list-flat">
              {visibleItems.map(item => (
              <li key={item.id} className={`category-item status-${item.status.toLowerCase()}`}>
                <label className="item-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="list-checkbox"
                  />
                </label>
                <div className="item-content">
                  <div className="item-name-row">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">{item.requiredQuantity} adet</span>
                  </div>
                  {(item.createdAt || (activeTab === "bought" && item.boughtAt)) && (
                    <div className="item-meta">
                      {[
                        item.createdAt
                          ? new Date(item.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : null,
                        activeTab === "bought" && item.boughtAt
                          ? `Alındı: ${new Date(item.boughtAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}`
                          : null
                      ].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <div className="item-right">
                  {activeTab === "bought" && (
                    <div className="item-slip">
                      {item.slipFileName ? (
                        <button type="button" className="slip-link slip-link-btn" onClick={() => openPreviewSlip(item.slipFileName!, item.name)}>
                          Fatura
                        </button>
                      ) : (
                        <label className="slip-upload-btn">
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) void handleSlipUploadInBought(item.id, f); }} className="slip-input-hidden" />
                          Yükle
                        </label>
                      )}
                    </div>
                  )}
                  {activeTab === "needed" && (
                    <button className="secondary btn-sm" onClick={() => openSlipModal(item.id)}>Alındı</button>
                  )}
                  <button type="button" className="btn-delete btn-sm" onClick={() => deleteItem(item.id)} title="Sil">Sil</button>
                </div>
                {item.createdBy && (
                  <div className="item-added-by">
                    {item.createdBy.profilePhoto && profilePhotoUrl(item.createdBy.profilePhoto) ? (
                      <img src={profilePhotoUrl(item.createdBy.profilePhoto)} alt="" className="item-creator-avatar" />
                    ) : (
                      <span className="item-creator-placeholder" aria-hidden />
                    )}
                    <span className="item-creator-name" style={item.createdBy.nameColor ? { color: item.createdBy.nameColor } : undefined}>
                      {item.createdBy.isim}{item.createdBy.soyisim ? ` ${item.createdBy.soyisim}` : ""}
                    </span>
                    {item.createdBy.roleLabel && (
                      <span className="item-creator-role">{item.createdBy.roleLabel}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
            </ul>
          </div>
        </section>
        )}
      </main>

      {previewSlip && (
        <div className="modal-overlay preview-overlay" onClick={closePreviewSlip}>
          <div className="modal preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>Fatura önizleme — {previewSlip.itemName}</h3>
              <button type="button" className="preview-close" onClick={closePreviewSlip} aria-label="Kapat">
                ×
              </button>
            </div>
            <div className="preview-content">
              {isPdf(previewSlip.fileName) ? (
                <iframe title="Fatura önizleme" src={previewSlip.url} className="preview-iframe" />
              ) : (
                <img src={previewSlip.url} alt="Fatura önizleme" className="preview-image" />
              )}
            </div>
            <div className="preview-actions-wrap">
              <div className="preview-name-edit">
                <label htmlFor="preview-download-name">Belge adı</label>
                <input
                  id="preview-download-name"
                  type="text"
                  value={previewDownloadName}
                  onChange={e => setPreviewDownloadName(e.target.value)}
                  className="preview-name-input"
                  placeholder="İndirilecek dosya adı"
                />
              </div>
              <div className="preview-actions">
                <a
                  href={previewSlip.url}
                  download={previewDownloadName || previewSlip.fileName}
                  className="preview-download-btn"
                >
                  İndir
                </a>
                <button type="button" className="secondary" onClick={closePreviewSlip}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {slipModalItemId != null && (
        <div className="modal-overlay" onClick={closeSlipModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Fatura / slip yükle</h3>
            <p className="modal-hint">Alındı işaretleyeceğiniz ürün için isteğe bağlı fatura veya fiş yükleyebilirsiniz.</p>
            <input
              ref={slipInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setSlipFile(e.target.files?.[0] ?? null)}
              className="modal-file-input"
            />
            {slipFile && <p className="modal-filename">{slipFile.name}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={closeSlipModal}>
                İptal
              </button>
              <button
                type="button"
                onClick={confirmMarkBoughtAndSlip}
                disabled={slipUploading}
              >
                {slipUploading ? "Yükleniyor..." : "Alındı işaretle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal add-modal" onClick={e => e.stopPropagation()}>
            <h3>Yeni öğe ekle</h3>
            <input
              type="text"
              placeholder="Malzeme adı..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="login-input"
              autoFocus
            />
            <input
              type="number"
              min={1}
              placeholder="Adet"
              className="login-input qty-input"
              value={newItemQuantity}
              onChange={e => setNewItemQuantity(e.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button type="button" onClick={() => { addItem(); setShowAddModal(false); }} disabled={!newItemName.trim()}>
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bottom-bar-wrap">
        <button type="button" className="add-item-bottom" onClick={() => setShowAddModal(true)}>
          + Öğe Ekle
        </button>
        <nav className="bottom-nav">
          <button
            type="button"
            className={`bottom-nav-item ${mainView === "home" ? "bottom-nav-active" : ""}`}
            onClick={() => setMainView("home")}
            aria-label="Ana Sayfa"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span>Ana Sayfa</span>
          </button>
          <button
            type="button"
            className={`bottom-nav-item ${mainView === "list" ? "bottom-nav-active" : ""}`}
            onClick={() => setMainView("list")}
            aria-label="Liste"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            <span>Liste</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
