package com.orbisis.ihitiac;

import com.orbisis.ihitiac.service.DataStore;
import com.orbisis.ihitiac.ui.LoginFrame;

import javax.swing.*;
import java.io.File;

public class Main {
    public static final DataStore DATA_STORE = new DataStore();

    public static void main(String[] args) {
        try {
            String jarDir = Main.class.getProtectionDomain().getCodeSource().getLocation().toURI().getPath();
            if (jarDir.endsWith(".jar")) {
                jarDir = new File(jarDir).getParent();
                DataStore.setBaseDir(jarDir);
            }
        } catch (Exception ignored) {}

        System.setProperty("file.encoding", "UTF-8");
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        SwingUtilities.invokeLater(() -> {
            LoginFrame login = new LoginFrame();
            login.setVisible(true);
        });
    }
}
