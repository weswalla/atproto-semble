CREATE INDEX "idx_cards_type_updated_at" ON "cards" USING btree ("type","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_cards_url_type" ON "cards" USING btree ("url","type");--> statement-breakpoint
CREATE INDEX "idx_cards_parent_type" ON "cards" USING btree ("parent_card_id","type") WHERE type = 'NOTE';--> statement-breakpoint
CREATE INDEX "idx_collection_cards_collection_added" ON "collection_cards" USING btree ("collection_id","added_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_collection_cards_card_collection" ON "collection_cards" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_library_memberships_user_type_covering" ON "library_memberships" USING btree ("user_id","added_at" DESC NULLS LAST);