import { IDomainEvent } from './IDomainEvent';
import { AggregateRoot } from '../AggregateRoot';
import { UniqueEntityID } from '../UniqueEntityID';

export class DomainEvents {
  private static markedAggregates: AggregateRoot<any>[] = [];

  /**
   * @method markAggregateForDispatch
   * @static
   * @desc Called by aggregate root objects that have created domain
   * events to eventually be dispatched when the infrastructure commits
   * the unit of work.
   */

  public static markAggregateForDispatch(aggregate: AggregateRoot<any>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<any>,
  ): void {
    const index = this.markedAggregates.findIndex((a) => a.equals(aggregate));
    this.markedAggregates.splice(index, 1);
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID,
  ): AggregateRoot<any> | null {
    for (let aggregate of this.markedAggregates) {
      if (aggregate.id.equals(id)) {
        return aggregate;
      }
    }
    return null;
  }

  /**
   * @method getEventsForAggregate
   * @static
   * @desc Get all domain events for a specific aggregate.
   * Used by use cases to retrieve events for publishing.
   */
  public static getEventsForAggregate(id: UniqueEntityID): IDomainEvent[] {
    const aggregate = this.findMarkedAggregateByID(id);
    return aggregate ? [...aggregate.domainEvents] : [];
  }

  /**
   * @method clearEventsForAggregate
   * @static
   * @desc Clear events for a specific aggregate after they have been published.
   * This removes the aggregate from the marked list and clears its events.
   */
  public static clearEventsForAggregate(id: UniqueEntityID): void {
    const aggregate = this.findMarkedAggregateByID(id);
    if (aggregate) {
      aggregate.clearEvents();
      this.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  /**
   * @method clearMarkedAggregates
   * @static
   * @desc Clear all marked aggregates. Useful for testing.
   */
  public static clearMarkedAggregates(): void {
    this.markedAggregates = [];
  }

  /**
   * @method hasEventsForAggregate
   * @static
   * @desc Check if an aggregate has pending events.
   */
  public static hasEventsForAggregate(id: UniqueEntityID): boolean {
    const aggregate = this.findMarkedAggregateByID(id);
    return aggregate ? aggregate.domainEvents.length > 0 : false;
  }

  /**
   * @method getAllMarkedAggregates
   * @static
   * @desc Get all aggregates that have pending events. Useful for debugging.
   */
  public static getAllMarkedAggregates(): AggregateRoot<any>[] {
    return [...this.markedAggregates];
  }
}
