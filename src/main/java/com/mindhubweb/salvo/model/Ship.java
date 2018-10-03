package com.mindhubweb.salvo.model;

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
public class Ship {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="gamePlayerID")
    private GamePlayer gamePlayer;

    @ElementCollection
    @Column(name="location")
    private List<String> cells = new ArrayList<>();

    public Ship() { }

    public Ship(String type, List<String> cells) {
        this.type = type;
        this.cells = cells;
    }

    public Map<String, Object> makeShipDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("type", this.getType());
        dto.put("locations", this.getCells());
        return dto;
    }

    public Long getId() { return id; }

    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }

    public void setType(String type) { this.type = type; }

    public GamePlayer getGamePlayer() { return gamePlayer; }

    public void setGamePlayer(GamePlayer gamePlayer) { this.gamePlayer = gamePlayer; }

    public List<String> getCells() { return cells; }

    public void setCells(List<String> cells) { this.cells = cells; }

    public void addCells(List<String> cells) { this.cells.addAll(cells); }
}
