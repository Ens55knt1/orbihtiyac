package com.orbisis.ihitiac.ui;

import javax.swing.*;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;

public final class Theme {
    private Theme() {}

    public static final Color BG = new Color(2, 6, 23);              // #020617
    public static final Color CARD = new Color(15, 23, 42);          // #0f172a
    public static final Color CARD_2 = new Color(30, 41, 59);        // #1e293b
    public static final Color TEXT = new Color(229, 231, 235);       // #e5e7eb
    public static final Color MUTED = new Color(148, 163, 184);      // #94a3b8
    public static final Color BORDER = new Color(51, 65, 85);        // #334155
    public static final Color PRIMARY = new Color(79, 70, 229);      // #4f46e5
    public static final Color DANGER = new Color(239, 68, 68);       // #ef4444

    public static void applyFrame(JFrame f) {
        f.getContentPane().setBackground(BG);
    }

    public static JPanel panelBg() {
        JPanel p = new JPanel();
        p.setOpaque(true);
        p.setBackground(BG);
        return p;
    }

    public static JPanel card() {
        JPanel p = new JPanel();
        p.setOpaque(true);
        p.setBackground(CARD);
        p.setBorder(new CompoundBorder(new LineBorder(new Color(BORDER.getRed(), BORDER.getGreen(), BORDER.getBlue(), 140), 1, true),
                new EmptyBorder(12, 12, 12, 12)));
        return p;
    }

    public static void labelTitle(JLabel l) {
        l.setForeground(TEXT);
        l.setFont(l.getFont().deriveFont(Font.BOLD, 18f));
    }

    public static void labelSub(JLabel l) {
        l.setForeground(MUTED);
    }

    public static void textField(JTextField f) {
        f.setBackground(BG);
        f.setForeground(TEXT);
        f.setCaretColor(TEXT);
        f.setBorder(new CompoundBorder(new LineBorder(new Color(MUTED.getRed(), MUTED.getGreen(), MUTED.getBlue(), 110), 1, true),
                new EmptyBorder(6, 10, 6, 10)));
    }

    public static void passwordField(JPasswordField f) {
        f.setBackground(BG);
        f.setForeground(TEXT);
        f.setCaretColor(TEXT);
        f.setBorder(new CompoundBorder(new LineBorder(new Color(MUTED.getRed(), MUTED.getGreen(), MUTED.getBlue(), 110), 1, true),
                new EmptyBorder(6, 10, 6, 10)));
    }

    public static void buttonPrimary(AbstractButton b) {
        b.setOpaque(true);
        b.setBackground(PRIMARY);
        b.setForeground(Color.WHITE);
        b.setBorder(new CompoundBorder(new LineBorder(new Color(99, 102, 241), 1, true), new EmptyBorder(6, 12, 6, 12)));
        b.setContentAreaFilled(true);
        b.setBorderPainted(true);
        b.setFocusPainted(false);
        b.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    public static void buttonSecondary(AbstractButton b) {
        b.setOpaque(true);
        b.setBackground(CARD_2);
        b.setForeground(TEXT);
        b.setBorder(new CompoundBorder(new LineBorder(new Color(MUTED.getRed(), MUTED.getGreen(), MUTED.getBlue(), 110), 1, true),
                new EmptyBorder(6, 12, 6, 12)));
        b.setContentAreaFilled(true);
        b.setBorderPainted(true);
        b.setFocusPainted(false);
        b.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    public static void buttonDanger(AbstractButton b) {
        b.setOpaque(true);
        b.setBackground(new Color(239, 68, 68, 35));
        b.setForeground(new Color(252, 165, 165));
        b.setBorder(new CompoundBorder(new LineBorder(new Color(239, 68, 68, 140), 1, true), new EmptyBorder(6, 12, 6, 12)));
        b.setContentAreaFilled(true);
        b.setBorderPainted(true);
        b.setFocusPainted(false);
        b.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    public static void togglePill(JToggleButton b) {
        b.setOpaque(true);
        b.setContentAreaFilled(true);
        b.setBorderPainted(true);
        applyToggleState(b);
        b.setFocusPainted(false);
        b.setCursor(new Cursor(Cursor.HAND_CURSOR));
    }

    public static void applyToggleState(JToggleButton b) {
        // initial
        setToggleColors(b, b.isSelected());
        b.addItemListener(e -> setToggleColors(b, b.isSelected()));
    }

    private static void setToggleColors(JToggleButton b, boolean selected) {
        if (selected) {
            b.setBackground(PRIMARY);
            b.setForeground(Color.WHITE);
            b.setBorder(new CompoundBorder(new LineBorder(new Color(99, 102, 241), 1, true), new EmptyBorder(6, 12, 6, 12)));
        } else {
            b.setBackground(CARD);
            b.setForeground(TEXT);
            b.setBorder(new CompoundBorder(new LineBorder(new Color(BORDER.getRed(), BORDER.getGreen(), BORDER.getBlue(), 160), 1, true),
                    new EmptyBorder(6, 12, 6, 12)));
        }
    }

    public static void spinner(JSpinner s) {
        JComponent editor = s.getEditor();
        if (editor instanceof JSpinner.DefaultEditor de) {
            JTextField tf = de.getTextField();
            textField(tf);
        }
    }

    public static void checkbox(JCheckBox cb) {
        cb.setOpaque(false);
        cb.setForeground(TEXT);
    }

    public static void combo(JComboBox<?> c) {
        c.setBackground(CARD_2);
        c.setForeground(TEXT);
    }
}

