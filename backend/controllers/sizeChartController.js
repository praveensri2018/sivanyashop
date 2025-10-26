const sizeChartService = require('../services/sizeChartService');

class SizeChartController {
    
    // Create new size chart
    async createSizeChart(req, res, next) {
        try {
            const { name, chartType, description, measurements } = req.body;
            
            const sizeChart = await sizeChartService.createSizeChart({
                name,
                chartType,
                description,
                measurements
            });
            
            res.json({ 
                success: true, 
                message: 'Size chart created successfully',
                sizeChart 
            });
        } catch (err) {
            next(err);
        }
    }

    // Get all size charts
    async getSizeCharts(req, res, next) {
        try {
            const { page = 1, limit = 20, chartType } = req.query;
            
            const result = await sizeChartService.getSizeCharts({
                page: parseInt(page),
                limit: parseInt(limit),
                chartType
            });
            
            res.json({ 
                success: true, 
                ...result 
            });
        } catch (err) {
            next(err);
        }
    }

    // Get size chart by ID
    async getSizeChartById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            const sizeChart = await sizeChartService.getSizeChartById(id);
            
            res.json({ 
                success: true, 
                sizeChart 
            });
        } catch (err) {
            next(err);
        }
    }

    // Update size chart
    async updateSizeChart(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const { name, chartType, description, measurements } = req.body;
            
            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (chartType !== undefined) updateData.chartType = chartType;
            if (description !== undefined) updateData.description = description;
            if (measurements !== undefined) updateData.measurements = measurements;
            
            const sizeChart = await sizeChartService.updateSizeChart(id, updateData);
            
            res.json({ 
                success: true, 
                message: 'Size chart updated successfully',
                sizeChart 
            });
        } catch (err) {
            next(err);
        }
    }

    // Delete size chart
    async deleteSizeChart(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            await sizeChartService.deleteSizeChart(id);
            
            res.json({ 
                success: true, 
                message: 'Size chart deleted successfully' 
            });
        } catch (err) {
            next(err);
        }
    }

    // Assign size chart to product
    async assignSizeChartToProduct(req, res, next) {
        try {
            const { productId, sizeChartId, isPrimary = false } = req.body;
            
            const assignment = await sizeChartService.assignSizeChartToProduct(
                productId, 
                sizeChartId, 
                isPrimary
            );
            
            res.json({ 
                success: true, 
                message: 'Size chart assigned to product successfully',
                assignment 
            });
        } catch (err) {
            next(err);
        }
    }

    // Remove size chart from product
    async removeSizeChartFromProduct(req, res, next) {
        try {
            const { productId, sizeChartId } = req.body;
            
            await sizeChartService.removeSizeChartFromProduct(productId, sizeChartId);
            
            res.json({ 
                success: true, 
                message: 'Size chart removed from product successfully' 
            });
        } catch (err) {
            next(err);
        }
    }

    // Get all size charts for a product
    async getProductSizeCharts(req, res, next) {
        try {
            const productId = parseInt(req.params.productId);
            
            const sizeCharts = await sizeChartService.getProductSizeCharts(productId);
            
            res.json({ 
                success: true, 
                sizeCharts 
            });
        } catch (err) {
            next(err);
        }
    }

    // Get primary size chart for a product
    async getPrimarySizeChart(req, res, next) {
        try {
            const productId = parseInt(req.params.productId);
            
            const sizeChart = await sizeChartService.getPrimarySizeChart(productId);
            
            res.json({ 
                success: true, 
                sizeChart 
            });
        } catch (err) {
            next(err);
        }
    }

    // Set primary size chart for a product
    async setPrimarySizeChart(req, res, next) {
        try {
            const { productId, sizeChartId } = req.body;
            
            const assignment = await sizeChartService.setPrimarySizeChart(productId, sizeChartId);
            
            res.json({ 
                success: true, 
                message: 'Primary size chart set successfully',
                assignment 
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new SizeChartController();