/**
 * POLSIM - TRADING SERVICE
 * 
 * Handles all player trading activities:
 * - Stock market trading (buy/sell ETF shares)
 * - Market item trading (homes, weapons, companies)
 * - Portfolio management
 * - Price calculations and profit tracking
 */

import { models } from '../models/mongoose';

export class TradingService {
  /**
   * Buy stock market shares
   * Player purchases shares in a sector ETF
   */
  async buyStock(
    sessionId: string,
    playerId: string,
    stockMarketId: string,
    shares: number
  ): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId });
      const stockMarket = await models.StockMarket.findById(stockMarketId);

      if (!portfolio) throw new Error('Portfolio not found');
      if (!stockMarket) throw new Error('Stock market not found');

      // Calculate cost
      const cost = stockMarket.currentPrice * shares;

      // Check if player has sufficient cash
      if (portfolio.cash < cost) {
        throw new Error(
          `Insufficient funds. Need $${cost}, have $${portfolio.cash}`
        );
      }

      // Check if enough shares available
      if (stockMarket.outstandingShares < shares) {
        throw new Error(`Only ${stockMarket.outstandingShares} shares available`);
      }

      // Update portfolio
      const existingStock = portfolio.stocks.find(
        (s: any) => s.stockMarketId.toString() === stockMarketId
      );

      if (existingStock) {
        existingStock.shares += shares;
      } else {
        portfolio.stocks.push({
          stockMarketId: stockMarketId as any,
          shares,
          purchasePrice: stockMarket.currentPrice,
          purchaseTurn: (await models.Session.findById(sessionId))?.currentTurn,
        });
      }

      portfolio.cash -= cost;
      await portfolio.save();

      // Update stock market outstanding shares
      stockMarket.outstandingShares -= shares;
      stockMarket.demand += shares; // Buying increases demand
      await stockMarket.save();

      return {
        success: true,
        cost,
        sharesOwned: existingStock ? existingStock.shares : shares,
        cashRemaining: portfolio.cash,
      };
    } catch (error) {
      console.error('Buy stock error:', error);
      throw error;
    }
  }

  /**
   * Sell stock market shares
   * Player sells owned shares in a sector
   */
  async sellStock(
    sessionId: string,
    playerId: string,
    stockMarketId: string,
    shares: number
  ): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId });
      const stockMarket = await models.StockMarket.findById(stockMarketId);

      if (!portfolio) throw new Error('Portfolio not found');
      if (!stockMarket) throw new Error('Stock market not found');

      // Find stock position
      const stockPosition = portfolio.stocks.find(
        (s: any) => s.stockMarketId.toString() === stockMarketId
      );

      if (!stockPosition || stockPosition.shares < shares) {
        throw new Error(`Only ${stockPosition?.shares || 0} shares owned`);
      }

      // Calculate proceeds
      const proceeds = stockMarket.currentPrice * shares;

      // Update portfolio
      stockPosition.shares -= shares;
      if (stockPosition.shares === 0) {
        portfolio.stocks = portfolio.stocks.filter(
          (s: any) => s.stockMarketId.toString() !== stockMarketId
        );
      }

      portfolio.cash += proceeds;
      await portfolio.save();

      // Update stock market
      stockMarket.outstandingShares += shares;
      stockMarket.supply += shares; // Selling increases supply
      await stockMarket.save();

      // Calculate profit/loss
      const costBasis = (stockPosition.purchasePrice || 0) * shares;
      const gainLoss = proceeds - costBasis;

      return {
        success: true,
        proceeds,
        gainLoss,
        gainLossPercent: ((gainLoss / costBasis) * 100).toFixed(2),
        sharesRemaining: stockPosition.shares,
        cashRemaining: portfolio.cash,
      };
    } catch (error) {
      console.error('Sell stock error:', error);
      throw error;
    }
  }

  /**
   * Buy market item (home, weapon, company)
   */
  async buyMarketItem(
    sessionId: string,
    playerId: string,
    marketItemId: string,
    quantity: number
  ): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId });
      const marketItem = await models.MarketItem.findById(marketItemId);

      if (!portfolio) throw new Error('Portfolio not found');
      if (!marketItem) throw new Error('Market item not found');

      // Calculate cost
      const cost = marketItem.currentPrice * quantity;

      // Check if player has sufficient cash
      if (portfolio.cash < cost) {
        throw new Error(
          `Insufficient funds. Need $${cost}, have $${portfolio.cash}`
        );
      }

      // Check if quantity available
      if (marketItem.quantity < quantity) {
        throw new Error(`Only ${marketItem.quantity} items available`);
      }

      // Update portfolio
      const existingItem = portfolio.marketItems.find(
        (item: any) => item.marketItemId.toString() === marketItemId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        portfolio.marketItems.push({
          marketItemId: marketItemId as any,
          quantity,
          purchasePrice: marketItem.currentPrice,
          purchaseTurn: (await models.Session.findById(sessionId))?.currentTurn,
        });
      }

      portfolio.cash -= cost;
      await portfolio.save();

      // Update market item inventory
      marketItem.quantity -= quantity;
      await marketItem.save();

      return {
        success: true,
        cost,
        itemsOwned: existingItem ? existingItem.quantity : quantity,
        cashRemaining: portfolio.cash,
      };
    } catch (error) {
      console.error('Buy market item error:', error);
      throw error;
    }
  }

  /**
   * Sell market item
   */
  async sellMarketItem(
    sessionId: string,
    playerId: string,
    marketItemId: string,
    quantity: number
  ): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId });
      const marketItem = await models.MarketItem.findById(marketItemId);

      if (!portfolio) throw new Error('Portfolio not found');
      if (!marketItem) throw new Error('Market item not found');

      // Find item position
      const itemPosition = portfolio.marketItems.find(
        (item: any) => item.marketItemId.toString() === marketItemId
      );

      if (!itemPosition || itemPosition.quantity < quantity) {
        throw new Error(`Only ${itemPosition?.quantity || 0} items owned`);
      }

      // Calculate proceeds
      const proceeds = marketItem.currentPrice * quantity;

      // Update portfolio
      itemPosition.quantity -= quantity;
      if (itemPosition.quantity === 0) {
        portfolio.marketItems = portfolio.marketItems.filter(
          (item: any) => item.marketItemId.toString() !== marketItemId
        );
      }

      portfolio.cash += proceeds;
      await portfolio.save();

      // Update market item
      marketItem.quantity += quantity;
      await marketItem.save();

      // Calculate profit/loss
      const costBasis = (itemPosition.purchasePrice || 0) * quantity;
      const gainLoss = proceeds - costBasis;

      return {
        success: true,
        proceeds,
        gainLoss,
        gainLossPercent: ((gainLoss / costBasis) * 100).toFixed(2),
        itemsRemaining: itemPosition.quantity,
        cashRemaining: portfolio.cash,
      };
    } catch (error) {
      console.error('Sell market item error:', error);
      throw error;
    }
  }

  /**
   * Get player portfolio
   */
  async getPortfolio(sessionId: string, playerId: string): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId })
        .populate('stocks.stockMarketId')
        .populate('marketItems.marketItemId');

      if (!portfolio) throw new Error('Portfolio not found');

      // Calculate portfolio value
      let stockValue = 0;
      let itemValue = 0;

      for (const stock of portfolio.stocks) {
        const stockMarket = stock.stockMarketId;
        stockValue += stockMarket.currentPrice * stock.shares;
      }

      for (const item of portfolio.marketItems) {
        const marketItem = item.marketItemId;
        itemValue += marketItem.currentPrice * item.quantity;
      }

      const totalValue = portfolio.cash + stockValue + itemValue;

      return {
        cash: portfolio.cash,
        stocks: portfolio.stocks,
        marketItems: portfolio.marketItems,
        portfolioValue: {
          cash: portfolio.cash,
          stocks: stockValue,
          items: itemValue,
          total: totalValue,
        },
      };
    } catch (error) {
      console.error('Get portfolio error:', error);
      throw error;
    }
  }

  /**
   * Calculate portfolio returns (profit/loss from purchase)
   */
  async calculateReturns(sessionId: string, playerId: string): Promise<any> {
    try {
      const portfolio = await models.PlayerPortfolio.findOne({ playerId, sessionId })
        .populate('stocks.stockMarketId')
        .populate('marketItems.marketItemId');

      if (!portfolio) throw new Error('Portfolio not found');

      let totalInvested = 0;
      let totalCurrent = 0;
      const holdings = [];

      // Calculate stock returns
      for (const stock of portfolio.stocks) {
        const cost = stock.purchasePrice * stock.shares;
        const current = stock.stockMarketId.currentPrice * stock.shares;
        const gain = current - cost;
        const percent = ((gain / cost) * 100).toFixed(2);

        totalInvested += cost;
        totalCurrent += current;

        holdings.push({
          type: 'stock',
          sector: stock.stockMarketId.sector,
          cost,
          current,
          gain: parseFloat(gain.toFixed(2)),
          percent,
        });
      }

      // Calculate market item returns
      for (const item of portfolio.marketItems) {
        const cost = item.purchasePrice * item.quantity;
        const current = item.marketItemId.currentPrice * item.quantity;
        const gain = current - cost;
        const percent = ((gain / cost) * 100).toFixed(2);

        totalInvested += cost;
        totalCurrent += current;

        holdings.push({
          type: 'item',
          name: item.marketItemId.name,
          cost,
          current,
          gain: parseFloat(gain.toFixed(2)),
          percent,
        });
      }

      return {
        totalInvested,
        totalCurrent,
        totalGain: parseFloat((totalCurrent - totalInvested).toFixed(2)),
        gainPercent: (
          ((totalCurrent - totalInvested) / totalInvested) *
          100
        ).toFixed(2),
        holdings,
      };
    } catch (error) {
      console.error('Calculate returns error:', error);
      throw error;
    }
  }
}

export default new TradingService();
