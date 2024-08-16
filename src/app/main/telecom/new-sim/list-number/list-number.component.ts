import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { TelecomServivce } from 'app/auth/service';
import { LockMobileDto } from 'app/auth/service/dto/new-sim.dto';
import { ProductService } from 'app/auth/service/product.service';
import { ObjectLocalStorage } from 'app/utils/constants';
import { SweetAlertService } from 'app/utils/sweet-alert.service';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-number',
  templateUrl: './list-number.component.html',
  styleUrls: ['./list-number.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListNumberComponent implements OnInit {

  @Output() lockMobile = new EventEmitter<any>();
  @Output() loadDone = new EventEmitter<any>();
  @Output() nextStep = new EventEmitter<any>();
  @Input() currentTaskId;
  @Input() isLoadData;
  @Input() currentStep;

  @ViewChildren('listNumber') listNumber: QueryList<ElementRef>

  isInViewEl: boolean = false;
  isLastListData: boolean = false;
  public list = [];
  public total:any;
  public searchForm: any = {
    keyword: '',
    page: 1,
  }
  public paramsSearch = {
    keysearch: '',
    brand: '',
    take: 10,
    skip: 0,
  }
  public page:number=1;
  public pageSize: number = 20;

  // public selectedSim = [];
  @BlockUI('section-block') sectionBlockUI: NgBlockUI;
  
  constructor(
    private telecomService: TelecomServivce,
    private productService: ProductService,
    private alertService :SweetAlertService,
  ) {  
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll($event) {
    if (this.isInViewport(this.listNumber.last.nativeElement) && !this.isInViewEl && !this.isLastListData) {
      console.log("in");
      this.isInViewEl = true;
      this.paramsSearch.skip += 10;
      this.page++;
      this.getData();
    } else if (!this.isInViewport(this.listNumber.last.nativeElement)) {
      console.log("not in");
      this.isInViewEl = false;
    }
    // if(this.currentStep && this.currentStep != undefined && this.currentStep == 1 && (window.innerHeight + window.scrollY + 2) >= document.body.offsetHeight) {
    //   this.paramsSearch.skip += 25;
    //   this.page++;
    //   this.getData();
    // }
  }

  onSubmitSearch() {
    this.list = [];
    this.getData();
  }

  async processSelectSim(event, item, sim_type = null) {
    let data = new LockMobileDto();
    data.mobile = item.name
    if(this.currentTaskId) {
      data.task_id = this.currentTaskId;
    }
    if(sim_type) {
      data['sim_type'] = sim_type;
    }

    //call api add mobile
    try {
      let res = await this.telecomService.taskCreate(data);
      if(!res.status) {
        this.alertService.showError(res.message);
        return;
      }

      this.nextStep.emit({ title: "Chọn gói cước", validate_step: true, mobile: item.name });
      this.lockMobile.emit({current_task: res.data, selected_telco: item.brand});
      localStorage.setItem(ObjectLocalStorage.CURRENT_SELECT_MOBILE, item.name);
      localStorage.setItem(ObjectLocalStorage.CURRENT_TASK, JSON.stringify(res.data));
    } catch (error) {      
      this.alertService.showError(error);
      return;
    }
  }
  async onSelectSim(event, item) {
    // this.listSelected.emit({item: item, event: event});
    if(!this.currentTaskId) {
      const swal = await this.alertService.showConfirm("Bạn muốn chọn loại SIM nào", "", "SIM vật lý", "Esim", true, false);
      if (swal.isConfirmed ) {
        console.log('sim');
        this.processSelectSim(event, item, 1);
      } else if (swal.dismiss === Swal.DismissReason.cancel ) {
        console.log('esim');
        this.processSelectSim(event, item, 2);
      }
    } else {
      this.processSelectSim(event, item);
    }
    
    
    //end

    
    // this.selectedSim.push(item);
    
    // console.log(this.selectedSim);
    // this.listSelected.emit(this.selectedSim);
  }
  loadPage(page) { 
    console.log(page);     
    this.paramsSearch.skip = this.paramsSearch.take * (page - 1);
    this.page=page;
    this.getData();
    
  }
  ngOnInit(): void {
    this.list = [];
    this.getData();
  }
  ngOnChanges(): void {
    if(this.isLoadData) {
      this.list = [];
      this.getData();
    }
  }
  getData(): void {
    this.sectionBlockUI.start();

    this.productService.getAll(this.paramsSearch).subscribe(res => {
      if(res.data.products.length > 0) {
        Array.prototype.push.apply(this.list, res.data.products);
      } else {
        this.isLastListData = true;
      }
      
      this.total= res.data.count;
      this.sectionBlockUI.stop();
      this.loadDone.emit({isLoadData: false});
    })
  }

  isInViewport(elm) {
    let elementTop = elm.getBoundingClientRect().top + window.scrollY;
    let elementBottom = elementTop + elm.offsetHeight;

    // in this specific case the scroller is document.documentElement (<html></html> node)
    let viewportTop = document.documentElement.scrollTop;
    let viewportBottom = viewportTop + document.documentElement.clientHeight;
    // console.log(elementTop, elementBottom, viewportTop, viewportBottom);
    return elementBottom > viewportTop && elementTop < viewportBottom;
  }

}
