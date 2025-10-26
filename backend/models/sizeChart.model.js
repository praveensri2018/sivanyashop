class SizeChart {
    constructor(id, name, chartType, description, measurements, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.chartType = chartType;
        this.description = description;
        this.measurements = measurements; // JSON array
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromDbRow(row) {
        return new SizeChart(
            row.Id,
            row.Name,
            row.ChartType,
            row.Description,
            row.Measurements ? JSON.parse(row.Measurements) : [],
            row.CreatedAt,
            row.UpdatedAt
        );
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            chartType: this.chartType,
            description: this.description,
            measurements: this.measurements,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

class ProductSizeChart {
    constructor(productId, sizeChartId, isPrimary, createdAt) {
        this.productId = productId;
        this.sizeChartId = sizeChartId;
        this.isPrimary = isPrimary;
        this.createdAt = createdAt;
    }

    static fromDbRow(row) {
        return new ProductSizeChart(
            row.ProductId,
            row.SizeChartId,
            row.IsPrimary,
            row.CreatedAt
        );
    }

    toJSON() {
        return {
            productId: this.productId,
            sizeChartId: this.sizeChartId,
            isPrimary: this.isPrimary,
            createdAt: this.createdAt
        };
    }
}

module.exports = { SizeChart, ProductSizeChart };