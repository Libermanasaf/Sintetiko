-- Allow a 0.5 rating (lowest step below 1).
alter table public.player_ratings drop constraint player_ratings_rating_check;
alter table public.player_ratings add constraint player_ratings_rating_check check (rating >= 0.5 and rating <= 5.0);
