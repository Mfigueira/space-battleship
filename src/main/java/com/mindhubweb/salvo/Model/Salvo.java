package com.mindhubweb.salvo.Model;

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
import java.util.stream.Collectors;

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

        Optional<GamePlayer> opponentGamePlayer = gamePlayer.getGame().getGamePlayers().stream().filter(gamePlayer2 -> gamePlayer2.getId() != this.gamePlayer.getId()).findFirst();
        if (opponentGamePlayer.isPresent()) {
            Set<Ship> opponentShips = opponentGamePlayer.get().getShips();
            dto.put("hits", this.getHits(this.shots, opponentShips));
            dto.put("sinks", this.getSinks(this.getTurn(), this.gamePlayer.getSalvoes(), opponentShips));
        }
        return dto;
    }

    public List<String> getHits(List <String> currentSalvoShots, Set<Ship> opponentShips) {
        return currentSalvoShots
            .stream()
            .filter(shot -> opponentShips
                .stream()
                .anyMatch(ship -> ship.getCells().contains(shot)))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getSinks(int turn, Set <Salvo> mySalvos, Set<Ship> opponentShips) {
        List<String> allShots = new ArrayList<>();
        mySalvos
            .stream()
            .filter(salvo -> salvo.getTurn() <= turn)
            .forEach(salvo -> allShots.addAll(salvo.getShots()));
        return opponentShips
            .stream()
            .filter(ship -> allShots.containsAll(ship.getCells()))
                .map(Ship::makeShipDTO)
                .collect(Collectors.toList());
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