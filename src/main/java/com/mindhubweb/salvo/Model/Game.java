package com.mindhubweb.salvo.Model;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
public class Game {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;

    private LocalDateTime creationDate;

    @OneToMany(mappedBy = "game", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<GamePlayer> gamePlayers;

    @OneToMany(mappedBy = "game", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<Score> scores;

    public Game() { }

    public Game(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public Map<String, Object> makeGameDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", this.getId());
        dto.put("created", this.getCreationDate());
        dto.put("ended", this.endDate(this.getGamePlayers()));
        dto.put("gamePlayers", this.getGamePlayers().stream().map(GamePlayer::makeGamePlayerDTO));
        return dto;
    }

    private LocalDateTime endDate(Set<GamePlayer> gamePlayers) {

        GamePlayer gamePlayer = gamePlayers.stream().findFirst().orElse(null);
        if ( (null != gamePlayer) && (gamePlayer.gameState() == GamePlayerState.WIN || gamePlayer.gameState() == GamePlayerState.LOSE || gamePlayer.gameState() == GamePlayerState.DRAW)) {
            return gamePlayer.getScore().getFinishDate();
        } else {
            return null;
        }
    }

    public long getId() { return id; }

    public void setId(long id) { this.id = id; }

    public LocalDateTime getCreationDate() { return creationDate; }

    public void setCreationDate(LocalDateTime creationDate) { this.creationDate = creationDate; }

    public Set<GamePlayer> getGamePlayers() { return gamePlayers; }

    public void setGamePlayers(Set<GamePlayer> gamePlayers) { this.gamePlayers = gamePlayers; }

    public void addGamePlayer(GamePlayer gamePlayer) {
        gamePlayer.setGame(this);
        gamePlayers.add(gamePlayer);
    }

    public Set<Score> getScores() { return scores; }

    public void setScores(Set<Score> scores) { this.scores = scores; }

    public void addScore(Score score) {
        score.setGame(this);
        scores.add(score);
    }
}