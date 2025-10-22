CREATE INDEX "cards_author_url_idx" ON "cards" USING btree ("author_id","url");--> statement-breakpoint
CREATE INDEX "cards_author_id_idx" ON "cards" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "collection_cards_card_id_idx" ON "collection_cards" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "collection_cards_collection_id_idx" ON "collection_cards" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "collections_author_id_idx" ON "collections" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "collections_author_updated_at_idx" ON "collections" USING btree ("author_id","updated_at");