from pydantic import BaseModel, Field
from ortools.constraint_solver import pywrapcp, routing_enums_pb2


class LogisticsInput(BaseModel):
    distances: list[list[int]]
    vehicle_count: int = Field(default=1, ge=1)
    vehicle_capacity: int = Field(default=1000, ge=1)
    demands: list[int]


def optimize_route(data: LogisticsInput) -> dict:
    """
    Simple vehicle-routing optimization using Google OR-Tools.
    Distances are supplied as a matrix.
    """

    manager = pywrapcp.RoutingIndexManager(
        len(data.distances),
        data.vehicle_count,
        0,
    )

    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data.distances[from_node][to_node]

    distance_index = routing.RegisterTransitCallback(
        distance_callback
    )

    routing.SetArcCostEvaluatorOfAllVehicles(distance_index)

    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data.demands[from_node]

    demand_index = routing.RegisterUnaryTransitCallback(
        demand_callback
    )

    routing.AddDimensionWithVehicleCapacity(
        demand_index,
        0,
        [data.vehicle_capacity] * data.vehicle_count,
        True,
        "Capacity",
    )

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(search_parameters)

    if solution is None:
        return {
            "status": "no_route_found",
            "source": "Google OR-Tools",
        }

    routes = []

    for vehicle_id in range(data.vehicle_count):
        index = routing.Start(vehicle_id)
        route = []

        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(
                routing.NextVar(index)
            )

        route.append(manager.IndexToNode(index))
        routes.append(route)

    return {
        "status": "optimized",
        "routes": routes,
        "total_distance": solution.ObjectiveValue(),
        "source": "Google OR-Tools",
    }
