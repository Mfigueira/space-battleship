package com.mindhubweb.salvo.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Score {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="gameID")
    private Game game;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="playerID")
    private Player player;

    private float scorePoint;

    private LocalDateTime finishDate;

    public Score() { }

    public Score(Game game, Player player, float scorePoint, LocalDateTime finishDate) {
        this.game = game;
        this.player = player;
        this.scorePoint = scorePoint;
        this.finishDate = finishDate;
    }

    public long getId() { return id; }

    public void setId(long id) { this.id = id; }

    public Game getGame() { return game; }

    public void setGame(Game game) { this.game = game; }

    public Player getPlayer() { return player; }

    public void setPlayer(Player player) { this.player = player; }

    public float getScorePoint() { return scorePoint; }

    public void setScorePoint(float scorePoint) { this.scorePoint = scorePoint; }

    public LocalDateTime getFinishDate() { return finishDate; }

    public void setFinishDate(LocalDateTime finishDate) { this.finishDate = finishDate; }

}
