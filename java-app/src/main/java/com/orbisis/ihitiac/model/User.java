package com.orbisis.ihitiac.model;

public class User {
    private int id;
    private String isim;
    private String soyisim;
    private String password;
    private String role;
    private boolean passwordChanged;

    public User() {}

    public User(int id, String isim, String soyisim, String password, String role, boolean passwordChanged) {
        this.id = id;
        this.isim = isim != null ? isim : "";
        this.soyisim = soyisim != null ? soyisim : "";
        this.password = password;
        this.role = role;
        this.passwordChanged = passwordChanged;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getIsim() { return isim; }
    public void setIsim(String isim) { this.isim = isim != null ? isim : ""; }
    public String getSoyisim() { return soyisim; }
    public void setSoyisim(String soyisim) { this.soyisim = soyisim != null ? soyisim : ""; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isPasswordChanged() { return passwordChanged; }
    public void setPasswordChanged(boolean passwordChanged) { this.passwordChanged = passwordChanged; }

    public String getDisplayName() {
        if (soyisim == null || soyisim.isBlank()) return isim;
        return isim + " " + soyisim;
    }
}
