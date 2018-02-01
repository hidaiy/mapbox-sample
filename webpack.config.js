const path = require('path');

// HTMLファイルの動的生成
const HtmlWebpackPlugin = require('html-webpack-plugin');

// distディレクトリのクリーンアップ
const CleanWebpackPlugin = require('clean-webpack-plugin');

// import dotenv from 'dotenv'
// dotenv.config();
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        app: './src/index.js'
    },

    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
    },


    plugins: [
        // distディレクトリのクリーンアップ
        new CleanWebpackPlugin(['dist']),

        // index.htmlファイルの動的生成
        new HtmlWebpackPlugin({
            title: 'mapbox sample',
            template: './src/index.html'
        }),
        new Dotenv({
            path: '.env'
        })
    ],

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },


    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader'
                ]
            }
        ]
    }
};
