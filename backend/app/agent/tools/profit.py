from pydantic import BaseModel, Field


class ProfitInput(BaseModel):
    quantity_kg: float = Field(gt=0)
    selling_price_per_kg: float = Field(ge=0)
    transport_cost: float = Field(ge=0)
    handling_cost: float = Field(ge=0)
    other_costs: float = Field(ge=0)


class ProfitResult(BaseModel):
    gross_revenue: float
    total_cost: float
    net_realization: float
    net_realization_per_kg: float


def calculate_profit(data: ProfitInput) -> ProfitResult:
    gross_revenue = data.quantity_kg * data.selling_price_per_kg

    total_cost = (
        data.transport_cost
        + data.handling_cost
        + data.other_costs
    )

    net_realization = gross_revenue - total_cost

    net_realization_per_kg = (
        net_realization / data.quantity_kg
    )

    return ProfitResult(
        gross_revenue=round(gross_revenue, 2),
        total_cost=round(total_cost, 2),
        net_realization=round(net_realization, 2),
        net_realization_per_kg=round(net_realization_per_kg, 2),
    )
