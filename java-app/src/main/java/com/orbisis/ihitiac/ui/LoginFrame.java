package com.orbisis.ihitiac.ui;

import com.orbisis.ihitiac.Main;
import com.orbisis.ihitiac.model.User;
import com.orbisis.ihitiac.service.DataStore;

import javax.swing.*;
import java.awt.*;

public class LoginFrame extends JFrame {
    private final DataStore store = Main.DATA_STORE;
    private JTextField isimField;
    private JTextField soyisimField;
    private JPasswordField passwordField;
    private JLabel errorLabel;

    public LoginFrame() {
        setTitle("ORBİSİS İhtiyaç - Giriş");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(400, 420);
        setLocationRelativeTo(null);
        setResizable(false);
        Theme.applyFrame(this);

        JPanel main = new JPanel(new BorderLayout(10, 10));
        main.setBorder(BorderFactory.createEmptyBorder(24, 24, 24, 24));
        main.setOpaque(true);
        main.setBackground(Theme.BG);

        JLabel title = new JLabel("ORBİSİS İHTİYAÇ");
        title.setFont(title.getFont().deriveFont(22f));
        title.setForeground(Theme.TEXT);
        title.setHorizontalAlignment(SwingConstants.CENTER);
        main.add(title, BorderLayout.NORTH);

        JPanel centerWrap = new JPanel(new BorderLayout());
        centerWrap.setOpaque(false);
        JPanel center = Theme.card();
        center.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(6, 0, 6, 0);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridwidth = 1;

        JLabel sub = new JLabel("Giriş yapın");
        Theme.labelSub(sub);
        sub.setHorizontalAlignment(SwingConstants.CENTER);
        gbc.gridy = 0;
        center.add(sub, gbc);

        errorLabel = new JLabel(" ");
        errorLabel.setForeground(new Color(248, 113, 113));
        errorLabel.setHorizontalAlignment(SwingConstants.CENTER);
        gbc.gridy = 1;
        center.add(errorLabel, gbc);

        isimField = new JTextField(20);
        isimField.setPreferredSize(new Dimension(280, 36));
        Theme.textField(isimField);
        addField(center, gbc, "İsim (admin için: admin)", isimField);

        soyisimField = new JTextField(20);
        soyisimField.setPreferredSize(new Dimension(280, 36));
        Theme.textField(soyisimField);
        addField(center, gbc, "Soyisim (admin için boş bırakın)", soyisimField);

        passwordField = new JPasswordField(20);
        passwordField.setPreferredSize(new Dimension(280, 36));
        Theme.passwordField(passwordField);
        addField(center, gbc, "Parola (admin: 123456)", passwordField);

        JButton loginBtn = new JButton("Giriş yap");
        loginBtn.setPreferredSize(new Dimension(280, 40));
        Theme.buttonPrimary(loginBtn);
        loginBtn.addActionListener(e -> doLogin());
        gbc.gridy++;
        center.add(loginBtn, gbc);

        JButton registerBtn = new JButton("Hesabım yok, kayıt ol");
        registerBtn.setForeground(new Color(147, 197, 253));
        registerBtn.setContentAreaFilled(false);
        registerBtn.setBorderPainted(false);
        registerBtn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        registerBtn.addActionListener(e -> openRegister());
        gbc.gridy++;
        center.add(registerBtn, gbc);

        centerWrap.add(center, BorderLayout.CENTER);
        main.add(centerWrap, BorderLayout.CENTER);
        add(main);
    }

    private void addField(JPanel p, GridBagConstraints gbc, String labelText, JComponent field) {
        gbc.gridy++;
        JLabel lbl = new JLabel(labelText);
        Theme.labelSub(lbl);
        p.add(lbl, gbc);
        gbc.gridy++;
        p.add(field, gbc);
    }

    private void doLogin() {
        errorLabel.setText(" ");
        String isim = isimField.getText().trim();
        String soyisim = soyisimField.getText().trim();
        String password = new String(passwordField.getPassword());
        User user = store.login(isim, soyisim, password);
        if (user == null) {
            errorLabel.setText("İsim, soyisim veya parola hatalı");
            return;
        }
        if ("admin".equals(user.getRole()) && !user.isPasswordChanged()) {
            int choice = JOptionPane.showOptionDialog(this,
                "İlk giriş — İsteğe bağlı şifre belirleme. Şimdi değiştirmek ister misiniz?",
                "Şifre",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.QUESTION_MESSAGE,
                null,
                new String[]{"Şifre değiştir", "Atla"},
                "Atla");
            if (choice == 0) {
                String newPw = JOptionPane.showInputDialog(this, "Yeni parola (en az 4 karakter):");
                if (newPw != null && newPw.length() >= 4) {
                    store.changePassword(user.getId(), password, newPw);
                } else {
                    store.skipPasswordChange(user.getId());
                }
            } else {
                store.skipPasswordChange(user.getId());
            }
            user = store.getUserById(user.getId());
        }
        setVisible(false);
        dispose();
        User finalUser = user;
        SwingUtilities.invokeLater(() -> {
            MainFrame mainFrame = new MainFrame(finalUser);
            mainFrame.setVisible(true);
        });
    }

    private void openRegister() {
        RegisterDialog dlg = new RegisterDialog(this);
        dlg.setVisible(true);
        User user = dlg.getRegisteredUser();
        if (user != null) {
            setVisible(false);
            dispose();
            SwingUtilities.invokeLater(() -> {
                MainFrame mainFrame = new MainFrame(user);
                mainFrame.setVisible(true);
            });
        }
    }
}
