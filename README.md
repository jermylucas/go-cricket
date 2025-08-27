# GoCricket

This project was created using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

## What is it?

Go Cricket (aka "Go Fish") is a simple card game where the objective is to collect books of cards. The game is played with a standard deck of 52 cards, and the goal is to collect as many books as possible before the deck runs out.

While this is playable on mobile, it's not optimized for it and you'll notice a few visual inconsistencies.

## Why?

I made this for an Angular assessment to demo some Angular 20 knowlege as well as to have a little bit of fun putting together an app that's less serious than what I usually do at work.

## Anything I could do in the future?

There's a lot that could be done to enhance this, and I recognize that. It's certainly not a complete game.

I think it'd be fun to add the ability to use sockets and make this a multiplayer game. Something where you could send a friend a unique url and they could play against you. Of course this would need to be hosted. So for now it's just a single player game.

## CPU Difficulty

The CPU players have different difficulty levels based on their name:

- Alice: Hard
- Bob: Medium
- Charlie: Easy

The difficulty level determines the percentage of optimal plays the CPU will make:

- Easy: 30% optimal plays
- Medium: 60% optimal plays
- Hard: 90% optimal plays

This "AI" is still a work in progress, I thought it'd be a fun idea to iterate in the future, but for now it's not as intelligent as it should be in the decisions (in any mode)
