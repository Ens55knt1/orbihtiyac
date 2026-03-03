package com.orbisis.ihitiac.ui;

import com.orbisis.ihitiac.Main;
import com.orbisis.ihitiac.model.User;
import com.orbisis.ihitiac.service.DataStore;

import javax.swing.*;
import java.awt.*;

public class RegisterDialog extends JDialog {
    private final DataStore store = Main.DATA_STORE;
    private User registeredUser;
    private JTextField isimField;
    private JTextField soyisimField;
    private JPasswordField passwordField;
    private JLabel errorLabel;

    public RegisterDialog(Frame parent) {
        super(parent, "Kayıt ol", true);
        setSize(400, 380);
        setLocationRelativeTo(parent);
        setResizable(false);

        JPanel main = new JPanel(new BorderLayout(10, 10));
        main.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
        main.setOpaque(true);
        main.setBackground(Theme.BG);
        getContentPane().setBackground(Theme.BG);

        JLabel title = new JLabel("Kayıt olun");
        title.setFont(title.getFont().deriveFont(18f));
        title.setHorizontalAlignment(SwingConstants.CENTER);
        title.setForeground(Theme.TEXT);
        main.add(title, BorderLayout.NORTH);

        JPanel center = Theme.card();
        center.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(4, 0, 4, 0);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        errorLabel = new JLabel(" ");
        errorLabel.setForeground(Color.RED);
        errorLabel.setHorizontalAlignment(SwingConstants.CENTER);
        gbc.gridy = 0;
        center.add(errorLabel, gbc);

        isimField = new JTextField(20);
        isimField.setPreferredSize(new Dimension(280, 32));
        Theme.textField(isimField);
        addField(center, gbc, "İsim *", isimField);

        soyisimField = new JTextField(20);
        soyisimField.setPreferredSize(new Dimension(280, 32));
        Theme.textField(soyisimField);
        addField(center, gbc, "Soyisim", soyisimField);

        passwordField = new JPasswordField(20);
        passwordField.setPreferredSize(new Dimension(280, 32));
        Theme.passwordField(passwordField);
        addField(center, gbc, "Parola (en az 4 karakter) *", passwordField);

        JButton btn = new JButton("Kayıt ol");
        btn.setPreferredSize(new Dimension(280, 36));
        Theme.buttonPrimary(btn);
        btn.addActionListener(e -> doRegister());
        gbc.gridy++;
        center.add(btn, gbc);

        main.add(center, BorderLayout.CENTER);
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

    private void doRegister() {
        errorLabel.setText(" ");
        String isim = isimField.getText().trim();
        String soyisim = soyisimField.getText().trim();
        String password = new String(passwordField.getPassword());
        User user = store.register(isim, soyisim, password);
        if (user == null) {
            if (isim.isEmpty() || password.length() < 4)
                errorLabel.setText("İsim ve parola (en az 4 karakter) gerekli");
            else
                errorLabel.setText("Bu isim ve soyisim zaten kayıtlı");
            return;
        }
        registeredUser = user;
        dispose();
    }

    public User getRegisteredUser() {
        return registeredUser;
    }
}
