import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MapService } from './services/map.service';
import {ShopService} from "./services/shop.service";

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [MapService, ShopService],
  bootstrap: [AppComponent]
})
export class AppModule { }
