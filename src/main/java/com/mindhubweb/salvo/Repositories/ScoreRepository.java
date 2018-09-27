package com.mindhubweb.salvo.Repositories;

import com.mindhubweb.salvo.Model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface ScoreRepository extends JpaRepository<Score, Long> {

}