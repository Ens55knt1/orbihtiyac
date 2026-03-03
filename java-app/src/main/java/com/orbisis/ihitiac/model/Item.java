package com.orbisis.ihitiac.model;

public class Item {
    private int id;
    private String name;
    private String category;
    private String status;
    private int requiredQuantity;
    private String location;
    private String createdAt;
    private String boughtAt;
    private String slipFileName;

    public static final String STATUS_NORMAL = "NORMAL";
    public static final String STATUS_LOW = "LOW";
    public static final String STATUS_MISSING = "MISSING";
    public static final String STATUS_BOUGHT = "BOUGHT";

    public static final String LOC_GENEL = "genel";
    public static final String LOC_FLOOR3 = "floor3";
    public static final String LOC_FLOOR6 = "floor6";

    public Item() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(int requiredQuantity) { this.requiredQuantity = requiredQuantity; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getBoughtAt() { return boughtAt; }
    public void setBoughtAt(String boughtAt) { this.boughtAt = boughtAt; }
    public String getSlipFileName() { return slipFileName; }
    public void setSlipFileName(String slipFileName) { this.slipFileName = slipFileName; }
}
