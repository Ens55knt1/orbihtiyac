package com.orbisis.ihitiac.ui;

import com.orbisis.ihitiac.Main;
import com.orbisis.ihitiac.model.User;
import com.orbisis.ihitiac.service.DataStore;

import javax.swing.*;
import java.awt.*;
import java.util.List;

public class AdminFrame extends JFrame {
    private final DataStore store = Main.DATA_STORE;
    private final User currentUser;
    private final JFrame parentFrame;
    private JPanel userListPanel;
    private JPasswordField currentPwField;
    private JPasswordField newPwField;
    private JLabel pwErrorLabel;

    public AdminFrame(User admin, JFrame parent) {
        this.currentUser = admin;
        this.parentFrame = parent;
        setTitle("Admin paneli");
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setSize(480, 520);
        setLocationRelativeTo(parent);
        Theme.applyFrame(this);

        JPanel main = new JPanel(new BorderLayout(10, 10));
        main.setBorder(BorderFactory.createEmptyBorder(16, 16, 16, 16));
        main.setOpaque(true);
        main.setBackground(Theme.BG);

        JButton backBtn = new JButton("← Geri");
        backBtn.addActionListener(e -> { setVisible(false); dispose(); });
        Theme.buttonSecondary(backBtn);
        main.add(backBtn, BorderLayout.NORTH);

        JTabbedPane tabs = new JTabbedPane();

        JPanel pwPanel = new JPanel(new GridBagLayout());
        pwPanel.setOpaque(true);
        pwPanel.setBackground(Theme.BG);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 6, 6, 6);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridx = 0;

        pwErrorLabel = new JLabel(" ");
        pwErrorLabel.setForeground(Color.RED);
        gbc.gridy = 0;
        pwPanel.add(pwErrorLabel, gbc);

        pwPanel.add(new JLabel("Mevcut parola:"), gbc);
        gbc.gridy++;
        currentPwField = new JPasswordField(20);
        currentPwField.setPreferredSize(new Dimension(220, 28));
        Theme.passwordField(currentPwField);
        pwPanel.add(currentPwField, gbc);
        gbc.gridy++;
        pwPanel.add(new JLabel("Yeni parola (en az 4 karakter):"), gbc);
        gbc.gridy++;
        newPwField = new JPasswordField(20);
        newPwField.setPreferredSize(new Dimension(220, 28));
        Theme.passwordField(newPwField);
        pwPanel.add(newPwField, gbc);
        gbc.gridy++;
        JButton savePwBtn = new JButton("Parolayı güncelle");
        savePwBtn.addActionListener(e -> changePassword());
        Theme.buttonPrimary(savePwBtn);
        pwPanel.add(savePwBtn, gbc);

        tabs.addTab("Şifre değiştir", pwPanel);

        JPanel rolesPanel = new JPanel(new BorderLayout(8, 8));
        rolesPanel.setOpaque(true);
        rolesPanel.setBackground(Theme.BG);
        rolesPanel.add(new JLabel("Kullanıcıların hangi kata ait olduğunu buradan atayabilirsiniz."), BorderLayout.NORTH);
        userListPanel = new JPanel();
        userListPanel.setLayout(new BoxLayout(userListPanel, BoxLayout.Y_AXIS));
        userListPanel.setOpaque(true);
        userListPanel.setBackground(Theme.BG);
        rolesPanel.add(new JScrollPane(userListPanel), BorderLayout.CENTER);
        tabs.addTab("Rol yönetimi", rolesPanel);

        main.add(tabs, BorderLayout.CENTER);
        add(main);
        refreshUserList();
    }

    private void changePassword() {
        pwErrorLabel.setText(" ");
        String current = new String(currentPwField.getPassword());
        String newPw = new String(newPwField.getPassword());
        if (store.changePassword(currentUser.getId(), current, newPw)) {
            currentPwField.setText("");
            newPwField.setText("");
            JOptionPane.showMessageDialog(this, "Parola güncellendi.");
        } else {
            pwErrorLabel.setText("Mevcut parola hatalı veya yeni parola en az 4 karakter olmalı.");
        }
    }

    private void refreshUserList() {
        userListPanel.removeAll();
        List<User> users = store.getAllUsers();
        for (User u : users) {
            JPanel row = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 8));
            row.setMaximumSize(new Dimension(Integer.MAX_VALUE, 44));
            row.setOpaque(true);
            row.setBackground(Theme.CARD);
            String display = u.getDisplayName();
            JLabel name = new JLabel(display);
            name.setForeground(Theme.TEXT);
            row.add(name);

            if ("admin".equals(u.getRole())) {
                JLabel adminLbl = new JLabel("Admin");
                adminLbl.setForeground(Theme.MUTED);
                row.add(adminLbl);
            } else {
                String[] roles = {"genel", "floor3", "floor6", "yonetici"};
                String[] labels = {"Genel", "3. kat", "6. kat", "Yönetici"};
                JComboBox<String> combo = new JComboBox<>(labels);
                Theme.combo(combo);
                for (int i = 0; i < roles.length; i++) {
                    if (roles[i].equals(u.getRole())) { combo.setSelectedIndex(i); break; }
                }
                combo.addActionListener(e -> {
                    int idx = combo.getSelectedIndex();
                    if (idx >= 0) store.updateUserRole(u.getId(), roles[idx]);
                });
                row.add(combo);
            }
            userListPanel.add(row);
        }
        userListPanel.revalidate();
        userListPanel.repaint();
    }
}
