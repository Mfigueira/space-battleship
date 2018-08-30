package com.mindhubweb.salvo;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ElementCollection;
import javax.persistence.Column;
import java.util.*;

@Entity
public class Salvo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int turn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gamePlayerID")
    private GamePlayer gamePlayer;

    @ElementCollection
    @Column(name = "location")
    private List<String> shots = new ArrayList<>();

    public Salvo() { }

    public Salvo(int turn, List<String> shots) {
        this.turn = turn;
        this.shots = shots;
    }

    public Map<String, Object> makeSalvoDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("turn", this.getTurn());
        dto.put("player", this.gamePlayer.getPlayer().getId());
        dto.put("locations", this.getShots());
        return dto;
    }

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public int getTurn() { return turn; }

    public void setTurn(int turn) { this.turn = turn; }

    public GamePlayer getGamePlayer() { return gamePlayer; }

    public void setGamePlayer(GamePlayer gamePlayer) { this.gamePlayer = gamePlayer; }

    public List<String> getShots() { return shots; }

    public void setShots(List<String> shots) { this.shots = shots; }

    public void addShots(List<String> shots) { this.shots.addAll(shots); }

}