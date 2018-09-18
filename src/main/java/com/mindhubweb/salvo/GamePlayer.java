package com.mindhubweb.salvo;

import javax.persistence.*;
import java.util.*;
import java.time.LocalDateTime;

@Entity
public class GamePlayer {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="gameID")
    private Game game;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="playerID")
    private Player player;

    private LocalDateTime joinDate;

    @OneToMany(mappedBy = "gamePlayer", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<Ship> ships = new HashSet<>();

    @OneToMany(mappedBy = "gamePlayer", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<Salvo> salvoes = new HashSet<>();

    public GamePlayer() { }

    public GamePlayer(Game game, Player player, LocalDateTime joinDate, Set<Ship> ships, Set<Salvo> salvoes) {
        this.joinDate = joinDate;
        this.game = game;
        this.player = player;
        this.addShips(ships);
        this.addSalvoes(salvoes);
    }

    public Map<String, Object> makeGamePlayerDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", this.getId());
        dto.put("player", this.player.makePlayerDTO());
        if (this.getScore() != null)
            dto.put("score", this.getScore().getScorePoint());
        else
            dto.put("score", this.getScore());
        return dto;
    }

    public Map<String, Object> makeGameViewDTO() {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", this.game.getId());
        dto.put("created", this.game.getCreationDate());
        dto.put("gamePlayers", this.game.getGamePlayers().stream().map(GamePlayer::makeGamePlayerDTO));
        dto.put("ships", this.getShips().stream().map(Ship::makeShipDTO));
        dto.put("salvoes", this.game.getGamePlayers().stream().flatMap(gamePlayer -> gamePlayer.getSalvoes().stream().map(Salvo::makeSalvoDTO)));
        return dto;
    }


    public long getId() { return id; }

    public void setId(long id) { this.id = id; }

    public Game getGame() { return game; }

    public void setGame(Game game) { this.game = game; }

    public Player getPlayer() { return player; }

    public void setPlayer(Player player) { this.player = player; }

    public LocalDateTime getJoinDate() { return joinDate; }

    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }

    public Set<Ship> getShips() { return ships; }

    public void setShips(Set<Ship> ships) { this.ships = ships; }

    public void addShip(Ship ship) {
        ship.setGamePlayer(this);
        ships.add(ship);
    }
    public void addShips(Set<Ship> ships) {
        ships.forEach(this::addShip);
    }

    public Set<Salvo> getSalvoes() { return salvoes; }

    public void setSalvoes(Set<Salvo> salvoes) { this.salvoes = salvoes; }

    public void addSalvo(Salvo salvo) {
        salvo.setGamePlayer(this);
        salvoes.add(salvo);
    }
    public void addSalvoes(Set<Salvo> salvoes) {
        salvoes.forEach(this::addSalvo);
    }

    public Score getScore () {
        return this.player.getScore(this.game);
    }
}
