package com.orbisis.ihitiac.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import com.orbisis.ihitiac.model.Item;
import com.orbisis.ihitiac.model.User;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class DataStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Type USER_LIST_TYPE = new TypeToken<ArrayList<User>>(){}.getType();
    private static final Type ITEM_LIST_TYPE = new TypeToken<ArrayList<Item>>(){}.getType();

    private static Path dataDir;
    private static Path usersFile;
    private static Path itemsFile;
    private static Path slipsDir;

    private final List<User> users = new CopyOnWriteArrayList<>();
    private final List<Item> items = new CopyOnWriteArrayList<>();

    static {
        String base = System.getProperty("app.home", System.getProperty("user.dir"));
        dataDir = Paths.get(base, "data");
        usersFile = dataDir.resolve("users.json");
        itemsFile = dataDir.resolve("items.json");
        slipsDir = Paths.get(base, "uploads", "slips");
    }

    public static void setBaseDir(String baseDir) {
        dataDir = Paths.get(baseDir, "data");
        usersFile = dataDir.resolve("users.json");
        itemsFile = dataDir.resolve("items.json");
        slipsDir = Paths.get(baseDir, "uploads", "slips");
    }

    public static Path getSlipsDir() {
        try {
            Files.createDirectories(slipsDir);
        } catch (IOException ignored) {}
        return slipsDir;
    }

    public DataStore() {
        load();
        if (users.isEmpty()) {
            User admin = new User(1, "admin", "", "123456", "admin", false);
            users.add(admin);
            saveUsers();
        }
    }

    private void load() {
        try {
            Files.createDirectories(dataDir);
        } catch (IOException ignored) {}
        if (Files.exists(usersFile)) {
            try {
                String json = Files.readString(usersFile, StandardCharsets.UTF_8);
                List<User> loaded = GSON.fromJson(json, USER_LIST_TYPE);
                if (loaded != null) users.addAll(loaded);
            } catch (Exception ignored) {}
        }
        if (Files.exists(itemsFile)) {
            try {
                String json = Files.readString(itemsFile, StandardCharsets.UTF_8);
                List<Item> loaded = GSON.fromJson(json, ITEM_LIST_TYPE);
                if (loaded != null) items.addAll(loaded);
            } catch (Exception ignored) {}
        }
    }

    public void saveUsers() {
        try {
            Files.write(usersFile, GSON.toJson(users).getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void saveItems() {
        try {
            Files.write(itemsFile, GSON.toJson(items).getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- Auth ---
    public User login(String isim, String soyisim, String password) {
        String i = (isim != null ? isim : "").trim();
        String s = (soyisim != null ? soyisim : "").trim();
        return users.stream()
            .filter(u -> u.getIsim().equals(i) && u.getSoyisim().equals(s) && u.getPassword().equals(password))
            .findFirst()
            .orElse(null);
    }

    public User register(String isim, String soyisim, String password) {
        String i = (isim != null ? isim : "").trim();
        String s = (soyisim != null ? soyisim : "").trim();
        if (i.isEmpty() || password == null || password.length() < 4) return null;
        String key = (i + "|" + s).toLowerCase();
        boolean exists = users.stream().anyMatch(u ->
            (u.getIsim() + "|" + u.getSoyisim()).toLowerCase().equals(key));
        if (exists) return null;
        int id = users.stream().mapToInt(User::getId).max().orElse(0) + 1;
        User u = new User(id, i, s, password, "genel", false);
        users.add(u);
        saveUsers();
        return u;
    }

    public User getUserById(int id) {
        return users.stream().filter(u -> u.getId() == id).findFirst().orElse(null);
    }

    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }

    public boolean updateUserRole(int userId, String role) {
        if (!"genel".equals(role) && !"floor3".equals(role) && !"floor6".equals(role) && !"yonetici".equals(role))
            return false;
        User u = getUserById(userId);
        if (u == null || "admin".equals(u.getRole())) return false;
        u.setRole(role);
        saveUsers();
        return true;
    }

    public boolean changePassword(int userId, String currentPassword, String newPassword) {
        User u = getUserById(userId);
        if (u == null || !u.getPassword().equals(currentPassword)) return false;
        if (newPassword == null || newPassword.length() < 4) return false;
        u.setPassword(newPassword);
        u.setPasswordChanged(true);
        saveUsers();
        return true;
    }

    public void skipPasswordChange(int userId) {
        User u = getUserById(userId);
        if (u != null && "admin".equals(u.getRole())) {
            u.setPasswordChanged(true);
            saveUsers();
        }
    }

    // --- Items ---
    public String getEffectiveLocation(User user, String selectedLocation) {
        if (user == null) return Item.LOC_GENEL;
        if ("admin".equals(user.getRole()) || "yonetici".equals(user.getRole())) return selectedLocation;
        if ("floor3".equals(user.getRole()) || "floor6".equals(user.getRole())) return user.getRole();
        return Item.LOC_GENEL;
    }

    public List<Item> getItemsForLocation(User user, String selectedLocation) {
        String loc = getEffectiveLocation(user, selectedLocation);
        return items.stream().filter(it -> loc.equals(it.getLocation())).toList();
    }

    public Item addItem(String name, int quantity, String location, User user) {
        String loc = getEffectiveLocation(user, location);
        int id = items.stream().mapToInt(Item::getId).max().orElse(0) + 1;
        Item it = new Item();
        it.setId(id);
        it.setName((name != null ? name : "").toUpperCase().trim());
        it.setCategory(CategoryUtil.autoCategory(it.getName()));
        it.setStatus(Item.STATUS_MISSING);
        it.setRequiredQuantity(quantity > 0 ? quantity : 1);
        it.setLocation(loc);
        it.setCreatedAt(Instant.now().toString());
        items.add(it);
        saveItems();
        return it;
    }

    public boolean updateItemStatus(int itemId, String status, User user) {
        Item it = items.stream().filter(i -> i.getId() == itemId).findFirst().orElse(null);
        if (it == null) return false;
        String loc = getEffectiveLocation(user, it.getLocation());
        if (!"admin".equals(user.getRole()) && !"yonetici".equals(user.getRole()) && !it.getLocation().equals(loc))
            return false;
        it.setStatus(status);
        if (Item.STATUS_BOUGHT.equals(status)) {
            it.setBoughtAt(Instant.now().toString());
        } else {
            it.setBoughtAt(null);
            it.setSlipFileName(null);
        }
        saveItems();
        return true;
    }

    public boolean setItemSlip(int itemId, String slipFileName, User user) {
        Item it = items.stream().filter(i -> i.getId() == itemId).findFirst().orElse(null);
        if (it == null) return false;
        String loc = getEffectiveLocation(user, it.getLocation());
        if (!"admin".equals(user.getRole()) && !"yonetici".equals(user.getRole()) && !it.getLocation().equals(loc))
            return false;
        it.setSlipFileName(slipFileName);
        saveItems();
        return true;
    }

    public boolean deleteItem(int itemId, User user) {
        Item it = items.stream().filter(i -> i.getId() == itemId).findFirst().orElse(null);
        if (it == null) return false;
        String loc = getEffectiveLocation(user, it.getLocation());
        if (!"admin".equals(user.getRole()) && !"yonetici".equals(user.getRole()) && !it.getLocation().equals(loc))
            return false;
        items.remove(it);
        saveItems();
        return true;
    }

    public void deleteItems(List<Integer> itemIds, User user) {
        for (int id : itemIds) deleteItem(id, user);
    }

    public Item getItemById(int id) {
        return items.stream().filter(i -> i.getId() == id).findFirst().orElse(null);
    }
}
