package com.mindhubweb.salvo;

import com.mindhubweb.salvo.Model.*;
import com.mindhubweb.salvo.Repositories.GamePlayerRepository;
import com.mindhubweb.salvo.Repositories.GameRepository;
import com.mindhubweb.salvo.Repositories.PlayerRepository;
import com.mindhubweb.salvo.Repositories.ScoreRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.time.LocalDateTime;
import java.util.*;

@SpringBootApplication
public class SalvoApplication {

	public static void main(String[] args) {
		SpringApplication.run(SalvoApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(PlayerRepository playerRepository, GameRepository gameRepository, GamePlayerRepository gamePlayerRepository, ScoreRepository scoreRepository) {
		return args -> {
			//---------------------------save some players-----------------------------------

			Player p1 = new Player ("J_bauer", "j.bauer@ctu.gov", "24", Side.DARK);
			playerRepository.save(p1);
			Player p2 = new Player("C_obrian", "c.obrian@ctu.gov","42", Side.LIGHT);
			playerRepository.save(p2);
			Player p3 = new Player("K_bauer", "kim_bauer@gmail.com", "kb", Side.DARK);
			playerRepository.save(p3);
			Player p4 = new Player("T_almeida", "t.almeida@ctu.gov", "mole", Side.LIGHT);
			playerRepository.save(p4);


			//---------------------------save some games-----------------------------------

			Game g1 = new Game(LocalDateTime.now());
			gameRepository.save(g1);
			Game g2 = new Game(LocalDateTime.now().plusSeconds(3600));
			gameRepository.save(g2);
			Game g3 = new Game(LocalDateTime.now().plusSeconds(7200));
			gameRepository.save(g3);
			Game g4 = new Game(LocalDateTime.now().plusSeconds(7200));
			gameRepository.save(g4);
			Game g5 = new Game(LocalDateTime.now().plusSeconds(7200));
			gameRepository.save(g5);


			//---------------------------save some ships-----------------------------------

			String cruiser = "cruiser";
			String destroyer = "destroyer";
			String starFighter = "starFighter";
			String fighter = "fighter";
			String bomber = "bomber";

			Set<Ship> shipSet1 = new HashSet<>();
			shipSet1.add(new Ship(cruiser, new ArrayList<>(Arrays.asList("H1", "H2", "H3", "H4", "H5"))));
			shipSet1.add(new Ship (starFighter, new ArrayList<>(Arrays.asList("D2", "D3"))));
			shipSet1.add(new Ship (fighter, new ArrayList<>(Arrays.asList("A8", "A9", "A10"))));
			shipSet1.add(new Ship (destroyer, new ArrayList<>(Arrays.asList("C4", "C5", "C6", "C7"))));
			shipSet1.add(new Ship (bomber, new ArrayList<>(Arrays.asList("F8", "F9", "F10"))));

			Set<Ship> shipSet2 = new HashSet<>();
			shipSet2.add(new Ship (cruiser, new ArrayList<>(Arrays.asList("B4", "B5", "B6", "B7", "B8"))));
			shipSet2.add(new Ship (starFighter, new ArrayList<>(Arrays.asList("D2", "D3"))));
			shipSet2.add(new Ship (fighter, new ArrayList<>(Arrays.asList("A5", "A6", "A7"))));
			shipSet2.add(new Ship (bomber, new ArrayList<>(Arrays.asList("G5", "H5", "I5"))));
			shipSet2.add(new Ship (destroyer, new ArrayList<>(Arrays.asList("F1", "F2", "F3", "F4"))));

			Set<Ship> shipSet3 = new HashSet<>();
			shipSet3.add(new Ship (cruiser, new ArrayList<>(Arrays.asList("C4", "C5", "C6", "C7", "C8"))));
			shipSet3.add(new Ship (bomber, new ArrayList<>(Arrays.asList("F5", "G5", "H5"))));

			Set<Ship> shipSet4 = new HashSet<>();
			shipSet4.add(new Ship (starFighter, new ArrayList<>(Arrays.asList("D2", "D3"))));
			shipSet4.add(new Ship (bomber, new ArrayList<>(Arrays.asList("B5", "C5", "D5"))));

			Set<Ship> shipSet5 = new HashSet<>();
			shipSet5.add(new Ship (starFighter, new ArrayList<>(Arrays.asList("D2", "D3"))));
			shipSet5.add(new Ship (fighter, new ArrayList<>(Arrays.asList("A1", "A2", "A3"))));


			//---------------------------save some salvoes-----------------------------------

			Set<Salvo> salvoes1 = new HashSet<>();
			salvoes1.add(new Salvo (1, new ArrayList<>(Arrays.asList("H1", "D3", "A3", "A9", "A8"))));
			salvoes1.add(new Salvo (2, new ArrayList<>(Arrays.asList("G5", "F2", "F3", "A10", "H2"))));
			salvoes1.add(new Salvo (3, new ArrayList<>(Arrays.asList("D2", "H5", "H4", "F10", "F9"))));

			Set<Salvo> salvoes2 = new HashSet<>();
			salvoes2.add(new Salvo (1, new ArrayList<>(Arrays.asList("A9", "A8", "A5", "D2", "H5"))));
			salvoes2.add(new Salvo (2, new ArrayList<>(Arrays.asList("A10", "H2", "I2", "D1", "D3"))));
			salvoes2.add(new Salvo (3, new ArrayList<>(Arrays.asList("F10", "F2", "A1", "A2", "A3"))));

			Set<Salvo> salvoes3 = new HashSet<>();
			salvoes3.add(new Salvo (1, new ArrayList<>(Arrays.asList("C4", "C5", "C3", "C7", "C8"))));
			salvoes3.add(new Salvo (2, new ArrayList<>(Arrays.asList("F10", "G5", "J5"))));

			Set<Salvo> salvoes4 = new HashSet<>();
			salvoes4.add(new Salvo (1, new ArrayList<>(Arrays.asList("I2", "I3"))));
			salvoes4.add(new Salvo (2, new ArrayList<>(Arrays.asList("A5", "C5", "D5"))));

			Set<Salvo> salvoes5 = new HashSet<>();
			salvoes5.add(new Salvo (1, new ArrayList<>(Arrays.asList("D2", "D3"))));
			salvoes5.add(new Salvo (2, new ArrayList<>(Arrays.asList("A10", "B10", "A5"))));


			//---------------------------save some game-players-----------------------------------

			gamePlayerRepository.save(new GamePlayer(g1, p1, LocalDateTime.now(), shipSet1, salvoes1));
			gamePlayerRepository.save(new GamePlayer(g1, p2, LocalDateTime.now(), shipSet2, salvoes2));
			gamePlayerRepository.save(new GamePlayer(g2, p3, LocalDateTime.now(), shipSet3, salvoes3));
			gamePlayerRepository.save(new GamePlayer(g2, p4, LocalDateTime.now(), shipSet4, salvoes4));
			gamePlayerRepository.save(new GamePlayer(g3, p2, LocalDateTime.now(), shipSet5, salvoes5));
			gamePlayerRepository.save(new GamePlayer(g3, p4, LocalDateTime.now(), new HashSet<>(), new HashSet<>()));
			gamePlayerRepository.save(new GamePlayer(g4, p2, LocalDateTime.now(), new HashSet<>(), new HashSet<>()));
			gamePlayerRepository.save(new GamePlayer(g4, p1, LocalDateTime.now(), new HashSet<>(), new HashSet<>()));
			gamePlayerRepository.save(new GamePlayer(g5, p4, LocalDateTime.now(), new HashSet<>(), new HashSet<>()));
			gamePlayerRepository.save(new GamePlayer(g5, p1, LocalDateTime.now(), new HashSet<>(), new HashSet<>()));


			//---------------------------save some scores-----------------------------------
			scoreRepository.save(new Score(g2, p3, 1, LocalDateTime.now()));
			scoreRepository.save(new Score(g2, p4, 1, LocalDateTime.now()));
			scoreRepository.save(new Score(g3, p2, 3, LocalDateTime.now()));
			scoreRepository.save(new Score(g3, p4, 0, LocalDateTime.now()));
			scoreRepository.save(new Score(g4, p2, 1, LocalDateTime.now()));
			scoreRepository.save(new Score(g4, p1, 1, LocalDateTime.now()));
			scoreRepository.save(new Score(g5, p4, 0, LocalDateTime.now()));
			scoreRepository.save(new Score(g5, p1, 3, LocalDateTime.now()));

		};
	}
}


