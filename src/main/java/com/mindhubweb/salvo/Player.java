package com.mindhubweb.salvo;

import javax.persistence.*;
import java.util.*;

@Entity
public class Player {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private long id;

    private String userName;

    private String email;

    private String password;

    private Side side;

    @OneToMany(mappedBy = "player", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<GamePlayer> gamePlayers;

    @OneToMany(mappedBy = "player", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<Score> scores;

    public Player() { }

    public Player(String userName, String email, String password, Side side) {
        this.userName = userName;
        this.email = email;
        this.password = password;
        this.side = side;
    }

    public Map<String, Object> makePlayerDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", this.getId());
        dto.put("userName", this.getUserName());
        dto.put("side", this.getSide());
        double totalScore = this.getScores().stream().mapToDouble(Score::getScorePoint).sum();
        dto.put("totalScore", totalScore);
        return dto;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getUserName() { return userName; }

    public void setUserName(String userName) { this.userName = userName; }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }

    public Side getSide() { return side; }

    public void setSide(Side side) { this.side = side; }

    public Set<GamePlayer> getGamePlayers() {
        return gamePlayers;
    }

    public void setGamePlayers(Set<GamePlayer> gamePlayers) {
        this.gamePlayers = gamePlayers;
    }

    public void addGamePlayer(GamePlayer gamePlayer) {
        gamePlayer.setPlayer(this);
        gamePlayers.add(gamePlayer);
    }

    public Set<Score> getScores() { return scores; }

    public Score getScore(Game game) {
        return scores.stream().filter(score -> score.getGame().getId() == game.getId()).findAny().orElse(null);
    }

    public void setScores(Set<Score> scores) { this.scores = scores; }

    public void addScore(Score score) {
        score.setPlayer(this);
        scores.add(score);
    }
}
