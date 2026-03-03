package com.orbisis.ihitiac.ui;

import com.orbisis.ihitiac.Main;
import com.orbisis.ihitiac.model.Item;
import com.orbisis.ihitiac.model.User;
import com.orbisis.ihitiac.service.CategoryUtil;
import com.orbisis.ihitiac.service.DataStore;

import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class MainFrame extends JFrame {
    private final DataStore store = Main.DATA_STORE;
    private final User currentUser;
    private String selectedLocation = Item.LOC_GENEL;
    private boolean showBought = false; // İhtiyaçlar vs Alınanlar
    private final List<Integer> selectedIds = new ArrayList<>();
    private JPanel listPanel;
    private JCheckBox selectAllCheck;
    private JTextField newNameField;
    private JSpinner newQtySpinner;
    private JButton adminBtn;
    private JButton deleteSelectedBtn;
    private boolean updatingSelectAll = false;

    public MainFrame(User user) {
        this.currentUser = user;
        setTitle("ORBİSİS İhtiyaç");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(520, 700);
        setLocationRelativeTo(null);

        JPanel main = new JPanel(new BorderLayout(8, 8));
        main.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        main.setOpaque(true);
        main.setBackground(Theme.BG);
        Theme.applyFrame(this);

        main.add(buildHeader(), BorderLayout.NORTH);
        main.add(buildContent(), BorderLayout.CENTER);
        add(main);
        refreshList();
    }

    private JPanel buildHeader() {
        JPanel p = new JPanel(new BorderLayout());
        p.setOpaque(true);
        p.setBackground(Theme.BG);
        JLabel title = new JLabel("ORBİSİS İHTİYAÇ");
        Theme.labelTitle(title);
        p.add(title, BorderLayout.WEST);

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 0));
        right.setOpaque(false);
        if ("admin".equals(currentUser.getRole())) {
            adminBtn = new JButton("Admin");
            adminBtn.addActionListener(e -> openAdmin());
            Theme.buttonSecondary(adminBtn);
            right.add(adminBtn);
        }
        JButton logoutBtn = new JButton("Çıkış");
        logoutBtn.addActionListener(e -> logout());
        Theme.buttonSecondary(logoutBtn);
        right.add(logoutBtn);
        p.add(right, BorderLayout.EAST);
        return p;
    }

    private JPanel buildContent() {
        JPanel content = new JPanel(new BorderLayout(0, 10));
        content.setOpaque(true);
        content.setBackground(Theme.BG);

        JPanel top = Theme.card();
        top.setLayout(new BoxLayout(top, BoxLayout.Y_AXIS));

        boolean showLocationTabs = "admin".equals(currentUser.getRole()) || "yonetici".equals(currentUser.getRole());
        if (showLocationTabs) {
            JPanel locTabs = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
            locTabs.setOpaque(false);
            ButtonGroup locGroup = new ButtonGroup();
            for (String loc : new String[]{Item.LOC_GENEL, Item.LOC_FLOOR3, Item.LOC_FLOOR6}) {
                String label = Item.LOC_GENEL.equals(loc) ? "Genel" : (Item.LOC_FLOOR3.equals(loc) ? "3. kat" : "6. kat");
                JToggleButton b = new JToggleButton(label);
                Theme.togglePill(b);
                b.setSelected(selectedLocation.equals(loc));
                b.addActionListener(e -> {
                    selectedLocation = loc;
                    selectedIds.clear();
                    refreshList();
                });
                locGroup.add(b);
                locTabs.add(b);
            }
            top.add(locTabs);
            top.add(Box.createVerticalStrut(10));
        } else {
            String locLabel = store.getEffectiveLocation(currentUser, selectedLocation);
            String label = Item.LOC_GENEL.equals(locLabel) ? "Genel" : (Item.LOC_FLOOR3.equals(locLabel) ? "3. kat" : "6. kat");
            JLabel locTitle = new JLabel(label);
            Theme.labelSub(locTitle);
            top.add(locTitle);
            top.add(Box.createVerticalStrut(10));
        }

        JPanel tabs = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
        tabs.setOpaque(false);
        ButtonGroup tabGroup = new ButtonGroup();
        JToggleButton needBtn = new JToggleButton("İhtiyaçlar");
        JToggleButton boughtBtn = new JToggleButton("Alınanlar");
        Theme.togglePill(needBtn);
        Theme.togglePill(boughtBtn);
        needBtn.setSelected(!showBought);
        boughtBtn.setSelected(showBought);
        needBtn.addActionListener(e -> {
            showBought = false;
            selectedIds.clear();
            refreshList();
        });
        boughtBtn.addActionListener(e -> {
            showBought = true;
            selectedIds.clear();
            refreshList();
        });
        tabGroup.add(needBtn);
        tabGroup.add(boughtBtn);
        tabs.add(needBtn);
        tabs.add(boughtBtn);
        top.add(tabs);
        top.add(Box.createVerticalStrut(12));

        JPanel addRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        addRow.setOpaque(false);
        JLabel malLbl = new JLabel("Malzeme");
        JLabel qtyLbl = new JLabel("Adet");
        Theme.labelSub(malLbl);
        Theme.labelSub(qtyLbl);
        newNameField = new JTextField(18);
        Theme.textField(newNameField);
        newQtySpinner = new JSpinner(new SpinnerNumberModel(1, 1, 999, 1));
        Theme.spinner(newQtySpinner);
        JButton addBtn = new JButton("Ekle");
        Theme.buttonPrimary(addBtn);
        addBtn.addActionListener(e -> addItem());
        addRow.add(malLbl);
        addRow.add(newNameField);
        addRow.add(qtyLbl);
        addRow.add(newQtySpinner);
        addRow.add(addBtn);
        top.add(addRow);
        top.add(Box.createVerticalStrut(10));

        JPanel actionsRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 0));
        actionsRow.setOpaque(false);
        selectAllCheck = new JCheckBox("Tümünü seç");
        Theme.checkbox(selectAllCheck);
        selectAllCheck.addActionListener(e -> {
            if (updatingSelectAll) return;
            toggleSelectAll();
        });
        actionsRow.add(selectAllCheck);
        deleteSelectedBtn = new JButton("Seçilenleri sil");
        Theme.buttonDanger(deleteSelectedBtn);
        deleteSelectedBtn.addActionListener(e -> deleteSelected());
        actionsRow.add(deleteSelectedBtn);
        top.add(actionsRow);

        listPanel = new JPanel();
        listPanel.setLayout(new BoxLayout(listPanel, BoxLayout.Y_AXIS));
        listPanel.setOpaque(true);
        listPanel.setBackground(Theme.BG);

        JScrollPane scroll = new JScrollPane(listPanel);
        scroll.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        scroll.getViewport().setOpaque(true);
        scroll.getViewport().setBackground(Theme.BG);
        scroll.setBorder(BorderFactory.createEmptyBorder());

        content.add(top, BorderLayout.NORTH);
        content.add(scroll, BorderLayout.CENTER);

        return content;
    }

    private void refreshList() {
        listPanel.removeAll();
        List<Item> items = getVisibleItems();

        updatingSelectAll = true;
        boolean allSelected = !items.isEmpty() && items.stream().allMatch(it -> selectedIds.contains(it.getId()));
        selectAllCheck.setSelected(allSelected);
        updatingSelectAll = false;
        deleteSelectedBtn.setText(selectedIds.isEmpty() ? "Seçilenleri sil" : ("Seçilenleri sil (" + selectedIds.size() + ")"));

        if (items.isEmpty()) {
            JLabel empty = new JLabel(showBought ? "Alınanlar listesi boş." : "İhtiyaç listesi boş.");
            Theme.labelSub(empty);
            empty.setBorder(BorderFactory.createEmptyBorder(14, 4, 0, 4));
            listPanel.add(empty);
            listPanel.revalidate();
            listPanel.repaint();
            return;
        }

        for (Item it : items) {
            JPanel row = new JPanel(new BorderLayout(6, 0));
            row.setBorder(BorderFactory.createCompoundBorder(
                new javax.swing.border.MatteBorder(0, 0, 1, 0, new Color(51, 65, 85, 160)),
                BorderFactory.createEmptyBorder(10, 6, 10, 6)
            ));
            row.setAlignmentX(Component.LEFT_ALIGNMENT);
            row.setOpaque(true);
            row.setBackground(new Color(15, 23, 42, 230));

            JCheckBox cb = new JCheckBox();
            cb.setSelected(selectedIds.contains(it.getId()));
            Theme.checkbox(cb);
            cb.addActionListener(e -> {
                if (cb.isSelected()) selectedIds.add(it.getId());
                else selectedIds.remove(Integer.valueOf(it.getId()));
                refreshList();
            });
            row.add(cb, BorderLayout.WEST);

            JPanel mid = new JPanel(new BorderLayout(0, 2));
            mid.setOpaque(false);
            String meta = it.getRequiredQuantity() + " adet";
            String catLabel = CategoryUtil.categoryLabel(it.getCategory());
            if (!catLabel.isEmpty()) meta += " · " + catLabel;
            if (it.getCreatedAt() != null) meta += " · Yüklendi: " + formatTime(it.getCreatedAt());
            if (showBought && it.getBoughtAt() != null) meta += " · Alındı: " + formatDate(it.getBoughtAt());
            JLabel nameLbl = new JLabel(it.getName());
            nameLbl.setForeground(Theme.TEXT);
            nameLbl.setFont(nameLbl.getFont().deriveFont(Font.BOLD, 14f));
            JLabel metaLbl = new JLabel(meta);
            metaLbl.setForeground(Theme.MUTED);
            metaLbl.setFont(metaLbl.getFont().deriveFont(12f));
            mid.add(nameLbl, BorderLayout.NORTH);
            mid.add(metaLbl, BorderLayout.CENTER);
            row.add(mid, BorderLayout.CENTER);

            JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 4, 0));
            right.setOpaque(false);
            if (showBought) {
                if (it.getSlipFileName() != null) {
                    JButton viewSlip = new JButton("Fatura görüntüle");
                    viewSlip.addActionListener(e -> viewSlip(it));
                    Theme.buttonSecondary(viewSlip);
                    right.add(viewSlip);
                } else {
                    JButton uploadSlip = new JButton("Fatura yükle");
                    uploadSlip.addActionListener(e -> uploadSlip(it));
                    Theme.buttonSecondary(uploadSlip);
                    right.add(uploadSlip);
                }
            } else {
                JButton boughtBtn = new JButton("Alındı");
                boughtBtn.addActionListener(e -> markBought(it));
                Theme.buttonPrimary(boughtBtn);
                right.add(boughtBtn);
            }
            JButton delBtn = new JButton("Sil");
            delBtn.addActionListener(e -> deleteItem(it));
            Theme.buttonDanger(delBtn);
            right.add(delBtn);
            row.add(right, BorderLayout.EAST);

            listPanel.add(row);
        }
        listPanel.revalidate();
        listPanel.repaint();
    }

    private List<Item> getVisibleItems() {
        return store.getItemsForLocation(currentUser, selectedLocation).stream()
            .filter(it -> showBought ? Item.STATUS_BOUGHT.equals(it.getStatus()) : !Item.STATUS_BOUGHT.equals(it.getStatus()))
            .sorted((a, b) -> Integer.compare(b.getId(), a.getId()))
            .collect(Collectors.toList());
    }

    private void toggleSelectAll() {
        if (selectAllCheck.isSelected()) {
            selectedIds.clear();
            for (Item it : getVisibleItems()) selectedIds.add(it.getId());
        } else {
            selectedIds.clear();
        }
        refreshList();
    }

    private void addItem() {
        String name = newNameField.getText().trim();
        if (name.isEmpty()) return;
        int qty = (Integer) newQtySpinner.getValue();
        store.addItem(name, qty, selectedLocation, currentUser);
        newNameField.setText("");
        newQtySpinner.setValue(1);
        selectedIds.clear();
        refreshList();
    }

    private void markBought(Item it) {
        store.updateItemStatus(it.getId(), Item.STATUS_BOUGHT, currentUser);
        refreshList();
    }

    private void deleteItem(Item it) {
        if (JOptionPane.showConfirmDialog(this, "Bu öğeyi silmek istediğinize emin misiniz?", "Onay", JOptionPane.YES_NO_OPTION) != JOptionPane.YES_OPTION) return;
        store.deleteItem(it.getId(), currentUser);
        refreshList();
    }

    private void deleteSelected() {
        if (selectedIds.isEmpty()) return;
        if (JOptionPane.showConfirmDialog(this, selectedIds.size() + " öğeyi silmek istediğinize emin misiniz?", "Onay", JOptionPane.YES_NO_OPTION) != JOptionPane.YES_OPTION) return;
        store.deleteItems(new ArrayList<>(selectedIds), currentUser);
        selectedIds.clear();
        refreshList();
    }

    private void uploadSlip(Item it) {
        JFileChooser fc = new JFileChooser();
        fc.setFileFilter(new FileNameExtensionFilter("PDF veya resim", "pdf", "jpg", "jpeg", "png"));
        if (fc.showOpenDialog(this) != JFileChooser.APPROVE_OPTION) return;
        Path src = fc.getSelectedFile().toPath();
        String ext = "";
        String name = src.getFileName().toString();
        int i = name.lastIndexOf('.');
        if (i > 0) ext = name.substring(i);
        String destName = it.getId() + "-" + System.currentTimeMillis() + ext;
        Path destDir = DataStore.getSlipsDir();
        Path dest = destDir.resolve(destName);
        try {
            Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
            store.setItemSlip(it.getId(), destName, currentUser);
            refreshList();
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, "Dosya kopyalanamadı: " + ex.getMessage());
        }
    }

    private void viewSlip(Item it) {
        Path slipsDir = DataStore.getSlipsDir();
        Path file = slipsDir.resolve(it.getSlipFileName());
        if (!Files.exists(file)) {
            JOptionPane.showMessageDialog(this, "Dosya bulunamadı.");
            return;
        }
        try {
            Desktop.getDesktop().open(file.toFile());
        } catch (IOException ex) {
            JOptionPane.showMessageDialog(this, "Açılamadı: " + ex.getMessage());
        }
    }

    private void openAdmin() {
        AdminFrame admin = new AdminFrame(currentUser, this);
        admin.setVisible(true);
    }

    private void logout() {
        setVisible(false);
        dispose();
        SwingUtilities.invokeLater(() -> {
            LoginFrame login = new LoginFrame();
            login.setVisible(true);
        });
    }

    private static String formatTime(String iso) {
        try {
            return DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm").withZone(ZoneId.systemDefault()).format(Instant.parse(iso));
        } catch (Exception e) { return iso; }
    }

    private static String formatDate(String iso) {
        try {
            return DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(ZoneId.systemDefault()).format(Instant.parse(iso));
        } catch (Exception e) { return iso; }
    }
}
