package com.mindhubweb.salvo.model;

public final class AppMessages {

    private AppMessages() {
        throw new IllegalStateException("Utility class");
    }

    public static final String KEY_ERROR = "error";
    public static final String KEY_USERNAME = "username";
    public static final String KEY_GAME_PLAYER_ID = "gpid";
    public static final String KEY_CREATED = "created";
    public static final String MSG_CREATED = "ok";
    public static final String MSG_ERROR_INCOMPLETE_FORM = "No Name, Password or Side indicated";
    public static final String MSG_ERROR_CONFLICT = "Requested element already exist";
    public static final String MSG_ERROR_FORBIDDEN = "Access Forbidden";
    public static final String MSG_ERROR_UNAUTHORIZED = "Unauthorized access";

}
