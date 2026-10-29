package com.example.sensoresynavdrawer;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.util.TypedValue;

import androidx.appcompat.app.AppCompatActivity;
import androidx.drawerlayout.widget.DrawerLayout;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.navigation.NavigationView;

public abstract class BaseDemoActivity extends AppCompatActivity {
    private static final int NAV_HOME = 1;
    private static final int NAV_ACCELEROMETER = 2;
    private static final int NAV_GYROSCOPE = 3;
    private static final int NAV_MAGNETOMETER = 4;
    private static final int NAV_GPS = 5;

    protected LinearLayout page;
    private LinearLayout metricsPanel;
    private TextView statusView;
    private DrawerLayout drawerLayout;

    protected void setupHomeScreen(String title, String subtitle) {
        createPage(title, subtitle);
    }

    protected void setupDemoScreen(String title, String subtitle) {
        createPage(title, subtitle);

        statusView = new TextView(this);
        statusView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        statusView.setTextColor(Color.rgb(31, 64, 93));
        statusView.setPadding(dp(16), dp(14), dp(16), dp(14));
        statusView.setBackground(rounded(Color.rgb(226, 241, 255), dp(14)));
        LinearLayout.LayoutParams statusParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        statusParams.topMargin = dp(22);
        page.addView(statusView, statusParams);
        setStatus("Preparando sensor…");

        metricsPanel = new LinearLayout(this);
        metricsPanel.setOrientation(LinearLayout.VERTICAL);
        metricsPanel.setPadding(dp(18), dp(8), dp(18), dp(8));
        metricsPanel.setBackground(rounded(Color.WHITE, dp(18)));
        metricsPanel.setElevation(dp(2));
        LinearLayout.LayoutParams panelParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        panelParams.topMargin = dp(18);
        page.addView(metricsPanel, panelParams);

        TextView heading = new TextView(this);
        heading.setText("Lecturas en tiempo real");
        heading.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        heading.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        heading.setTextColor(Color.rgb(31, 41, 55));
        heading.setPadding(0, dp(12), 0, dp(8));
        metricsPanel.addView(heading);
    }

    private void createPage(String title, String subtitle) {
        drawerLayout = new DrawerLayout(this);
        drawerLayout.setBackgroundColor(Color.rgb(244, 247, 251));

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(Color.rgb(244, 247, 251));

        LinearLayout appBar = new LinearLayout(this);
        appBar.setOrientation(LinearLayout.HORIZONTAL);
        appBar.setGravity(Gravity.CENTER_VERTICAL);
        appBar.setPadding(dp(8), 0, dp(16), 0);
        appBar.setBackgroundColor(Color.WHITE);
        TextView menuButton = new TextView(this);
        menuButton.setText("☰");
        menuButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 26);
        menuButton.setTextColor(Color.rgb(38, 76, 112));
        menuButton.setGravity(Gravity.CENTER);
        menuButton.setContentDescription("Abrir menú de navegación");
        appBar.addView(menuButton, new LinearLayout.LayoutParams(dp(48), dp(56)));

        TextView appBarTitle = new TextView(this);
        appBarTitle.setText(title);
        appBarTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        appBarTitle.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        appBarTitle.setTextColor(Color.rgb(22, 45, 70));
        LinearLayout.LayoutParams appBarTitleParams = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        appBar.addView(appBarTitle, appBarTitleParams);
        shell.addView(appBar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(56)));

        View divider = new View(this);
        divider.setBackgroundColor(Color.rgb(229, 234, 240));
        shell.addView(divider, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(1)));

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(22), dp(22), dp(22), dp(28));
        page.setBackgroundColor(Color.rgb(244, 247, 251));
        scroll.addView(page, new ScrollView.LayoutParams(
                ScrollView.LayoutParams.MATCH_PARENT, ScrollView.LayoutParams.WRAP_CONTENT));
        shell.addView(scroll, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        drawerLayout.addView(shell, new DrawerLayout.LayoutParams(
                DrawerLayout.LayoutParams.MATCH_PARENT, DrawerLayout.LayoutParams.MATCH_PARENT));

        NavigationView navigationView = createNavigationView();
        int drawerWidth = Math.min(dp(320), (int) (getResources().getDisplayMetrics().widthPixels * 0.88f));
        DrawerLayout.LayoutParams drawerParams = new DrawerLayout.LayoutParams(
                drawerWidth, DrawerLayout.LayoutParams.MATCH_PARENT);
        drawerParams.gravity = Gravity.START;
        drawerLayout.addView(navigationView, drawerParams);

        menuButton.setOnClickListener(view -> drawerLayout.openDrawer(Gravity.START));
        setContentView(drawerLayout);

        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        titleView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        titleView.setTextColor(Color.rgb(22, 45, 70));
        page.addView(titleView);

        TextView subtitleView = new TextView(this);
        subtitleView.setText(subtitle);
        subtitleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        subtitleView.setTextColor(Color.rgb(90, 105, 120));
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        subtitleParams.topMargin = dp(8);
        page.addView(subtitleView, subtitleParams);

    }

    private NavigationView createNavigationView() {
        NavigationView navigationView = new NavigationView(this);
        navigationView.setBackgroundColor(Color.WHITE);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setGravity(Gravity.BOTTOM);
        header.setPadding(dp(22), dp(20), dp(22), dp(20));
        header.setBackgroundColor(Color.rgb(38, 101, 166));
        TextView headerTitle = new TextView(this);
        headerTitle.setText("Sensores Android");
        headerTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        headerTitle.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        headerTitle.setTextColor(Color.WHITE);
        header.addView(headerTitle);
        TextView headerSubtitle = new TextView(this);
        headerSubtitle.setText("Demostraciones");
        headerSubtitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        headerSubtitle.setTextColor(Color.rgb(225, 239, 255));
        LinearLayout.LayoutParams headerSubtitleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        headerSubtitleParams.topMargin = dp(4);
        header.addView(headerSubtitle, headerSubtitleParams);
        navigationView.addHeaderView(header);

        Menu menu = navigationView.getMenu();
        menu.setGroupCheckable(0, true, true);
        menu.add(0, NAV_HOME, Menu.NONE, "Inicio").setCheckable(true);
        menu.add(0, NAV_ACCELEROMETER, Menu.NONE, "Acelerómetro").setCheckable(true);
        menu.add(0, NAV_GYROSCOPE, Menu.NONE, "Giroscopio").setCheckable(true);
        menu.add(0, NAV_MAGNETOMETER, Menu.NONE, "Magnetómetro").setCheckable(true);
        menu.add(0, NAV_GPS, Menu.NONE, "GPS").setCheckable(true);
        navigationView.setCheckedItem(currentNavigationItem());
        navigationView.setNavigationItemSelectedListener(this::onNavigationItemSelected);
        return navigationView;
    }

    private int currentNavigationItem() {
        if (this instanceof MainActivity) return NAV_HOME;
        if (this instanceof AccelerometerActivity) return NAV_ACCELEROMETER;
        if (this instanceof GyroscopeActivity) return NAV_GYROSCOPE;
        if (this instanceof MagnetometerActivity) return NAV_MAGNETOMETER;
        if (this instanceof GpsActivity) return NAV_GPS;
        return NAV_HOME;
    }

    private boolean onNavigationItemSelected(MenuItem item) {
        Class<?> destination;
        switch (item.getItemId()) {
            case NAV_HOME:
                destination = MainActivity.class;
                break;
            case NAV_ACCELEROMETER:
                destination = AccelerometerActivity.class;
                break;
            case NAV_GYROSCOPE:
                destination = GyroscopeActivity.class;
                break;
            case NAV_MAGNETOMETER:
                destination = MagnetometerActivity.class;
                break;
            case NAV_GPS:
                destination = GpsActivity.class;
                break;
            default:
                drawerLayout.closeDrawer(Gravity.START);
                return false;
        }

        drawerLayout.closeDrawer(Gravity.START);
        if (!destination.equals(getClass())) {
            Intent intent = new Intent(this, destination);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
        }
        return true;
    }

    protected TextView addMetric(String label, String initialValue) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(13), 0, dp(13));

        TextView labelView = new TextView(this);
        labelView.setText(label);
        labelView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        labelView.setTextColor(Color.rgb(92, 105, 119));
        row.addView(labelView, new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView valueView = new TextView(this);
        valueView.setText(initialValue);
        valueView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        valueView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        valueView.setTextColor(Color.rgb(28, 48, 67));
        valueView.setGravity(Gravity.END);
        row.addView(valueView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        if (metricsPanel.getChildCount() > 1) {
            View divider = new View(this);
            divider.setBackgroundColor(Color.rgb(233, 237, 242));
            metricsPanel.addView(divider, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, dp(1)));
        }
        metricsPanel.addView(row);
        return valueView;
    }

    protected void setStatus(String text) {
        if (statusView != null) statusView.setText(text);
    }

    protected void addActionButton(String text, View.OnClickListener listener) {
        MaterialButton button = new MaterialButton(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        button.setTextColor(Color.WHITE);
        button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                Color.rgb(38, 101, 166)));
        button.setCornerRadius(dp(16));
        button.setInsetTop(0);
        button.setInsetBottom(0);
        button.setPadding(dp(16), dp(12), dp(16), dp(12));
        button.setOnClickListener(listener);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(12);
        page.addView(button, params);
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        return drawable;
    }

    protected int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }
}